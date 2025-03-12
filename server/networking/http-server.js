// Servidor HTTP per servir arxius estàtics
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

// Determina el tipus MIME segons l'extensió de l'arxiu
function getMimeType(filename) {
  const extension = filename.split(".").pop().toLowerCase();
  const mimeTypes = {
    html: "text/html",
    css: "text/css",
    js: "text/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
  };

  return mimeTypes[extension] || "application/octet-stream";
}

// Configura les capçaleres de la resposta HTTP
function header(resposta, codi, cType) {
  resposta.setHeader("Access-Control-Allow-Origin", "*");
  resposta.setHeader("Access-Control-Allow-Methods", "GET");
  if (cType) resposta.writeHead(codi, { "Content-Type": cType });
  else resposta.writeHead(codi);
}

// Envia l'arxiu al client
function enviarArxiu(resposta, dades, filename, cType, err) {
  if (err) {
    header(resposta, 400, "text/html");
    resposta.end(
      "<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>Error al llegir l'arxiu</p>"
    );
    return;
  }

  header(resposta, 200, cType);
  resposta.write(dades);
  resposta.end();
}

// Gestiona les peticions HTTP
function onRequest(peticio, resposta) {
  let cosPeticio = "";

  peticio
    .on("error", function (err) {
      console.error(err);
    })
    .on("data", function (dades) {
      cosPeticio += dades;
    })
    .on("end", function () {
      resposta.on("error", function (err) {
        console.error(err);
      });

      if (peticio.method == "GET") {
        const q = url.parse(peticio.url, true);
        let filename = "." + q.pathname;

        if (filename == "./") filename += "index.html";

        // Busca a l'arrel del projecte
        const rootPath = path.join(__dirname, "../..");
        const filePath = path.join(rootPath, filename.substring(1));

        if (fs.existsSync(filePath)) {
          // Determina el tipus MIME segons l'extensió
          const mimeType = getMimeType(filePath);
          console.log(`Sirviendo ${filePath} con tipo MIME: ${mimeType}`);

          fs.readFile(filePath, function (err, dades) {
            enviarArxiu(resposta, dades, filePath, mimeType, err);
          });
        } else {
          header(resposta, 404, "text/html");
          resposta.end(
            "<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>404 Not Found</p>"
          );
        }
      }
    });
}

// Exporta les funcions necessàries
module.exports = {
  start: (port) => {
    const server = http.createServer();
    server.on("request", onRequest);
    server.listen(port, "0.0.0.0", () => {
      console.log(`Servidor HTTP escuchando en http://0.0.0.0:${port}`);
    });
    return server;
  },
};
