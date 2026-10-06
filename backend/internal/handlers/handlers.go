package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"regexp"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var datePattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

type Config struct {
	AllowedOrigin string
	DB            *pgxpool.Pool
	Logger        *slog.Logger
}

type Handler struct {
	allowedOrigin string
	db            *pgxpool.Pool
	logger        *slog.Logger
}

type colorResponse struct {
	ColorHex string `json:"colorHex"`
	Date     string `json:"date"`
	Source   string `json:"source"`
}

func New(cfg Config) *Handler {
	return &Handler{
		allowedOrigin: cfg.AllowedOrigin,
		db:            cfg.DB,
		logger:        cfg.Logger,
	}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.healthz)
	mux.HandleFunc("GET /api/colors/today", h.getTodayColor)
	mux.HandleFunc("GET /api/colors", h.getColorByDate)

	return h.withCORS(h.withLogging(mux))
}

func (h *Handler) healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) getTodayColor(w http.ResponseWriter, r *http.Request) {
	today := time.Now().UTC()
	color, err := h.findColorByDate(r, today)
	if err != nil {
		h.writeColorError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, color)
}

func (h *Handler) getColorByDate(w http.ResponseWriter, r *http.Request) {
	dateParam := r.URL.Query().Get("date")
	if !datePattern.MatchString(dateParam) {
		writeError(w, http.StatusBadRequest, "date must use YYYY-MM-DD format")
		return
	}

	selectedDate, err := time.ParseInLocation(time.DateOnly, dateParam, time.UTC)
	if err != nil {
		writeError(w, http.StatusBadRequest, "date must be a valid calendar date")
		return
	}

	color, err := h.findColorByDate(r, selectedDate)
	if err != nil {
		h.writeColorError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, color)
}

func (h *Handler) findColorByDate(r *http.Request, selectedDate time.Time) (colorResponse, error) {
	ctx, cancel := contextWithRequestTimeout(r)
	defer cancel()

	startOfDay := time.Date(selectedDate.Year(), selectedDate.Month(), selectedDate.Day(), 0, 0, 0, 0, time.UTC)
	nextDay := startOfDay.AddDate(0, 0, 1)

	var color string
	var storedAt time.Time

	err := h.db.QueryRow(ctx, `
		SELECT color_hex, date
		FROM daily_colors
		WHERE date >= $1 AND date < $2
		LIMIT 1
	`, startOfDay, nextDay).Scan(&color, &storedAt)
	if err != nil {
		return colorResponse{}, err
	}

	return colorResponse{
		ColorHex: color,
		Date:     storedAt.UTC().Format(time.DateOnly),
		Source:   "database",
	}, nil
}

func (h *Handler) writeColorError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "color is not available for that date")
		return
	}

	h.logger.Error("query color", "error", err)
	writeError(w, http.StatusInternalServerError, "could not load color")
}

func (h *Handler) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == h.allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (h *Handler) withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		h.logger.Info("request", "method", r.Method, "path", r.URL.Path, "duration_ms", time.Since(start).Milliseconds())
	})
}

func contextWithRequestTimeout(r *http.Request) (context.Context, context.CancelFunc) {
	return context.WithTimeout(r.Context(), 3*time.Second)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
