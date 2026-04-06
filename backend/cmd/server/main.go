package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := loadConfig()

	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// Routes
	r.Get("/health", handleHealth)

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", handleNotImplemented)
		r.Post("/login", handleNotImplemented)
		r.Post("/refresh", handleNotImplemented)
		r.Delete("/logout", handleNotImplemented)
	})

	r.Route("/books", func(r chi.Router) {
		// r.Use(authMiddleware) -- uncomment once auth is wired up
		r.Get("/", handleNotImplemented)
		r.Post("/", handleNotImplemented)
		r.Get("/{bookID}/content", handleNotImplemented)
		r.Delete("/{bookID}", handleNotImplemented)
		r.Post("/{bookID}/chat", handleNotImplemented)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second, // longer for streaming chat responses
		IdleTimeout:  60 * time.Second,
	}

	// Start server in background, block on OS signal
	go func() {
		log.Printf("server listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}
	log.Println("server stopped")
}

type config struct {
	Port           string
	AllowedOrigins []string
	OllamaURL      string
	DatabaseURL    string
	JWTSecret      string
}

func loadConfig() config {
	return config{
		Port:           getEnv("PORT", "8080"),
		AllowedOrigins: []string{getEnv("FRONTEND_ORIGIN", "http://localhost:5173")},
		OllamaURL:      getEnv("OLLAMA_URL", "http://localhost:11434"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

// Placeholder for routes not yet implemented.
func handleNotImplemented(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	w.Write([]byte(`{"error":"not implemented"}`))
}
