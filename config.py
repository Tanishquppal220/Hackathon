class Config:
    SECRET_KEY = 'your-secret-key-here'
    DEBUG = False

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
