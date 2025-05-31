const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/get-datos', async (req, res) => {
    console.log('📡 Conectando a MongoDB...');
    const client = new MongoClient('mongodb+srv://sku:sku@sku.ngbnktq.mongodb.net/sku?retryWrites=true&w=majority&appName=sku&tls=true');


    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db('sku');
        console.log("🗂️ Usando base de datos: 'sku'");

        const hoja1 = await db.collection('ventas').find().toArray();
        const hoja2 = await db.collection('stock').find().toArray();

        console.log(`📄 Ventas obtenidas: ${hoja1.length}`);
        console.log(`📦 Stock obtenido: ${hoja2.length}`);

        console.log("🔍 Primeras 3 ventas:", hoja1.slice(0, 3));
        console.log("🔍 Primeros 3 productos de stock:", hoja2.slice(0, 3));

        const stockProductos = {};
        const vendedores = {};
        const segmentosHoja1 = new Set();

        // Procesar hoja1 (ventas)
        for (const row of hoja1) {
            const {
                pdv,
                razon,
                sku,
                producto,
                segmento,
                cantidad,
                vendedor
            } = row;

            if (!vendedor || !razon || !sku || !segmento || !cantidad) continue;

            segmentosHoja1.add(segmento.trim());

            if (!vendedores[vendedor]) vendedores[vendedor] = {};
            if (!vendedores[vendedor][razon]) vendedores[vendedor][razon] = [];

            const yaExiste = vendedores[vendedor][razon]
                .some(item => item.codigoProducto === sku);

            if (!yaExiste) {
                vendedores[vendedor][razon].push({
                    codigoProducto: sku,
                    nombreSku: producto,
                    segmento: segmento.trim(),
                    cantidadVendida: cantidad
                });
            }
        }

        // Procesar hoja2 (stock)
        for (const row of hoja2) {
            const codigo = row['CODIGO  ']; // ⚠️ campo con espacios
            const nombre = row.producto;
            const segmento = row.canal;
            const cantidadStock = Number(row.stock);
            const fechaStock = row.vencimiento;

            if (cantidadStock > 0 && codigo) {
                stockProductos[codigo] = {
                    nombreProducto: nombre,
                    segmento: segmento.trim(),
                    cantidadStock,
                    fechaStock
                };
            }
        }

        console.log(`👤 Vendedores procesados: ${Object.keys(vendedores).length}`);
        console.log(`📊 Segmentos encontrados en ventas: ${Array.from(segmentosHoja1).join(', ')}`);
        console.log(`📦 Productos con stock positivo: ${Object.keys(stockProductos).length}`);

        res.json({
            stockProductos,
            vendedores,
            segmentosHoja1: Array.from(segmentosHoja1)
        });

    } catch (error) {
        console.error('❌ Error al leer desde MongoDB:', error);
        res.status(500).json({ error: 'Error al leer desde MongoDB', message: error.message });
    } finally {
        await client.close();
        console.log('🔒 Conexión a MongoDB cerrada.');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
