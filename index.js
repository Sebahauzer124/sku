const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const archivoExcel = path.join(__dirname, 'Libro1.xlsx');

app.get('/get-datos', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(archivoExcel);

        // Aseguramos que las hojas estén correctamente cargadas
        const hoja1 = workbook.getWorksheet('Hoja1');
        const hoja2 = workbook.getWorksheet('Hoja2');

        if (!hoja1 || !hoja2) {
            return res.status(400).json({ error: 'No se pudieron encontrar las hojas "Hoja 1" o "Hoja 2" en el archivo Excel.' });
        }

        const stockProductos = {};
        const vendedores = {};
        const segmentosHoja1 = new Set();  // Set para los segmentos de hoja1

        // Extraemos segmentos de Hoja 1
        hoja1.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Omitir encabezados
            let segmento = row.getCell(5).value;  // Suponiendo que está en la columna E (columna 5)
            if (segmento && segmento.result) segmento = segmento.result;
            if (segmento) segmentosHoja1.add(segmento);
        });

        const segmentos = [...segmentosHoja1];

        // Procesamos Hoja 1 (vendedores y productos vendidos) y Hoja 2 (stock de productos)
        hoja1.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Omitir encabezados

            let codigoPdv = row.getCell(1).value; // Código PDV (columna A)
            let razonSocial = row.getCell(2).value; // Razón social (columna B)
            let codigoProducto = row.getCell(3).value; // Código del SKU (columna C)
            let nombreSku = row.getCell(4).value; // Nombre del SKU (columna D)
            let segmento = row.getCell(5).value; // Segmento (columna E)
            let cantidadVendida = row.getCell(6).value; // Cantidad vendida (columna F)
            let vendedor = row.getCell(7).value; // Vendedor (columna G)

            // Verificar si el vendedor, razón social, código de producto o segmento son válidos
            if (!vendedor || !razonSocial || !codigoProducto || !segmento || !cantidadVendida) return;

            // Asegurar que los valores sean correctos
            if (vendedor && vendedor.result) vendedor = vendedor.result;
            if (razonSocial && razonSocial.result) razonSocial = razonSocial.result;
            if (codigoProducto && codigoProducto.result) codigoProducto = codigoProducto.result;
            if (segmento && segmento.result) segmento = segmento.result;

            // Si el código del producto no es válido, omitir esa fila
            if (!codigoProducto || codigoProducto === '') return;

            // Crear la estructura si no existe
            if (!vendedores[vendedor]) {
                vendedores[vendedor] = {};  // Crear objeto para el vendedor
            }

            if (!vendedores[vendedor][razonSocial]) {
                vendedores[vendedor][razonSocial] = [];  // Crear arreglo para la razón social
            }

            // Verificar si el producto ya está en la lista, si no, agregarlo
            if (!vendedores[vendedor][razonSocial].some(item => item.codigoProducto === codigoProducto)) {
                // Agregar el producto con el nombre, segmento y cantidad vendida
                vendedores[vendedor][razonSocial].push({
                    codigoProducto,
                    nombreSku,
                    segmento,
                    cantidadVendida
                });
            }
        });

        // Procesando la Hoja 2 (Stock de productos)
        hoja2.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Omitir encabezados

            let codigoProducto = row.getCell(1).value; // Código de producto (columna A)
            let nombreProducto = row.getCell(2).value; // Nombre del producto (columna B)
            let segmento = row.getCell(3).value; // Segmento (columna C)
            let cantidadStock = row.getCell(4).value; // Stock disponible (columna D)

            // Si los valores son objetos con la propiedad 'result', extraer el valor
            if (codigoProducto && codigoProducto.result) codigoProducto = codigoProducto.result;
            if (nombreProducto && nombreProducto.result) nombreProducto = nombreProducto.result;
            if (segmento && segmento.result) segmento = segmento.result;
            if (cantidadStock && cantidadStock.result) cantidadStock = cantidadStock.result;

            // Asegurarse de que cantidadStock sea un número
            cantidadStock = Number(cantidadStock);

            if (cantidadStock > 0) {
                stockProductos[codigoProducto] = { nombreProducto, segmento, cantidadStock };
            }
        });

        // Responder con los resultados
        res.json({ stockProductos, vendedores, segmentosHoja1: segmentos });
    } catch (error) {
        console.error('Error al leer el archivo Excel:', error);
        res.status(500).json({ error: 'Error al leer el archivo Excel', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
