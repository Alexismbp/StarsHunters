# Stars Hunters

## Requisitos

- XAMPP instalado
- Node.js y npm instalados
- TypeScript (`npm install -g typescript`)

## Instalación

1. Clona este repositorio en tu carpeta XAMPP htdocs:

   ```
   git clone <url-repositorio> /Applications/XAMPP/xamppfiles/htdocs/Practiques/M12-Projecte/StarsHunters
   ```

2. Instala las dependencias:

   ```
   cd /Applications/XAMPP/xamppfiles/htdocs/Practiques/M12-Projecte/StarsHunters
   npm install
   ```

3. Compila los archivos TypeScript:
   ```
   npm run build
   ```

## Ejecución

1. Inicia XAMPP (Apache)
2. Accede a la aplicación a través de:
   - http://localhost/Practiques/M12-Projecte/StarsHunters/

## Desarrollo

Para trabajar en modo desarrollo con recompilación automática:

```
npm run watch
```

Esto recompilará automáticamente los archivos TypeScript cuando detecte cambios.
