package config

import (
	"errors"
	"fmt"
	"os"
)

type Config struct {
	Addr          string
	AllowedOrigin string
	DatabaseURL   string
}

func Load() (Config, error) {
	cfg := Config{
		Addr:          getEnv("ADDR", ":8080"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://127.0.0.1:5173"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}

	if cfg.AllowedOrigin == "*" {
		return Config{}, fmt.Errorf("ALLOWED_ORIGIN must be an explicit origin, not %q", cfg.AllowedOrigin)
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
