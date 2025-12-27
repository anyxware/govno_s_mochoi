package config

import (
	"log"
	"os"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	Env            string `yaml:"env" env:"ENV" env-default:"local" env-required:"true"`
	FrontendServer `yaml:"frontend"`
	BackendServer  `yaml:"backend"`
	Database       `yaml:"database"`
}

type Database struct {
	Host     string `yaml:"host" env:"Host" env-default:"localhost"`
	Port     string `yaml:"port" env:"Port" env-default:"5432"`
	User     string `yaml:"user" env:"User" env-required:"true"`
	Password string `yaml:"password" env:"Password" env-required:"true"`
	DBname   string `yaml:"dbname" env:"DBname" env-default:"postgresql"`
}

type FrontendServer struct {
	Host string `yaml:"host" env:"Host" env-default:"localhost"`
	Port string `yaml:"port" env:"Port" env-default:"3000"`
}

type BackendServer struct {
	Host string `yaml:"host" env:"Host" env-default:"localhost"`
	Port string `yaml:"port" env:"Port" env-default:"8080"`
}

func GetConfig() *Config {
	stage := os.Getenv("STAGE")

	var configPath string
	if stage == "prod" {
		configPath = "config/prod.yaml"
	} else if stage == "" {
		log.Print("Env $STAGE isn't set. Using local config")
		log.Print("Available values for $STAGE: prod, dev, local")
		configPath = "config/local.yaml"
	} else {
		log.Print("Env $STAGE set in incorrect value. Using local config")
		log.Print("Available values for $STAGE: prod, dev, local")
		configPath = "config/local.yaml"
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		log.Fatalf("File in %s path doesn't exit", configPath)
	}

	var cfg Config

	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		log.Fatalf("Can't read file from %s", configPath)
	}

	return &cfg
}
