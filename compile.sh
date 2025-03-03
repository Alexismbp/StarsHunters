#!/bin/bash

echo "Compilando archivos TypeScript..."

# Verificar si TypeScript está instalado globalmente
if ! command -v tsc &> /dev/null
then
    echo "TypeScript no está instalado. Por favor instálalo usando:"
    echo "npm install -g typescript"
    exit 1
fi

# Compilar los archivos
tsc

# Verificar si la compilación fue exitosa
if [ $? -eq 0 ]; then
    echo "Compilación exitosa. Los archivos se encuentran en la carpeta dist/"
    
    # Verificar que los archivos existen
    if [ -f "./dist/pyramid.js" ] && [ -f "./dist/admin.js" ]; then
        echo "Los archivos pyramid.js y admin.js fueron creados correctamente."
    else
        echo "Error: No se encontraron los archivos compilados en la carpeta dist/"
    fi
else
    echo "Error durante la compilación."
fi
