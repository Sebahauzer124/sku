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
        
        const hoja1 = workbook.getWorksheet('Hoja1');
        const hoja2 = workbook.getWorksheet('Hoja2');


        const stockProductos = {};
        const vendedores = {};  // Objeto para almacenar la información de los vendedores y productos vendidos

        hoja1.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Omitir encabezados
        
            let valorCeldaA = row.getCell(1).value; // Valor de la celda A (columna 1)
            
            // Si el valor de la celda A es un objeto con la propiedad 'result', extraer el valor
            if (valorCeldaA && valorCeldaA.result) {
                valorCeldaA = valorCeldaA.result;
            }
        
            // Si el valor de la celda A es 0, se omite esa fila
            if (valorCeldaA === 0 || !valorCeldaA) return;
        
            let vendedor = row.getCell(6).value;  // Obtener valor del vendedor
            let razonSocial = row.getCell(2).value;  // Obtener valor de la razón social
            let codigoProducto = row.getCell(3).value; // Obtener valor del código de producto
        
            // Verificar si el vendedor, razón social y código de producto son válidos
            if (!vendedor || !razonSocial || !codigoProducto) return;
        
            // Asegurar que los valores sean correctos
            if (vendedor && vendedor.result) vendedor = vendedor.result;
            if (razonSocial && razonSocial.result) razonSocial = razonSocial.result;
            if (codigoProducto && codigoProducto.result) codigoProducto = codigoProducto.result;
        
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
            if (!vendedores[vendedor][razonSocial].includes(codigoProducto)) {
                vendedores[vendedor][razonSocial].push(codigoProducto);
            //    console.log(`Producto agregado: Vendedor: ${vendedor}, Razón Social: ${razonSocial}, Producto: ${codigoProducto}`);
            }
        
        });
        
        // Ver los datos de vendedores y productos vendidos
      //  console.log("Datos de vendedores y productos vendidos:", JSON.stringify(vendedores, null, 2));
        

//   Procesando la Hoja2 (Stock)
hoja2.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Omitir encabezados

    let codigoProducto = row.getCell(1).value;
    let segmento = row.getCell(2).value;
    let cantidadStock = row.getCell(3).value;

    // Si los valores son objetos con la propiedad 'result', extraer el valor
    if (codigoProducto && codigoProducto.result) codigoProducto = codigoProducto.result;
    if (segmento && segmento.result) segmento = segmento.result;
    if (cantidadStock && cantidadStock.result) cantidadStock = cantidadStock.result;

    // Asegurarse de que cantidadStock sea un número
    cantidadStock = Number(cantidadStock);

    console.log(`Fila ${rowNumber} - Código: ${codigoProducto}, Segmento: ${segmento}, Cantidad en stock: ${cantidadStock}`);

    if (cantidadStock > 0) {
        stockProductos[codigoProducto] = { segmento, cantidadStock };
    }
});

//console.log("Datos de stock de productos:", stockProductos);






    } catch (error) {
        console.error('Error al leer el archivo Excel:', error);
        res.status(500).json({ error: 'Error al leer el archivo Excel', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
