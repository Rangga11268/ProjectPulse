# Dockerfile untuk Laravel Backend
FROM php:8.3-fpm-alpine

# Install system dependencies & PHP extensions
RUN apk add --no-linux-headers --no-cache \
    mysql-client \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    curl \
    git \
    oniguruma-dev

RUN docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
