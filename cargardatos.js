// cargarExcelMongo.js
const xlsx = require('xlsx');
const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://sku:sku@sku.ngbnktq.mongodb.net/?retryWrites=true&w=majority&appName=sku';
const DB_NAME = 'sku';

(async () => {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log("✅ Conectado a MongoDB");

        const db = client.db(DB_NAME);

        const workbook = xlsx.readFile('./Libro1.xlsx');
        const hoja1 = xlsx.utils.sheet_to_json(workbook.Sheets['Hoja1']);
        const hoja2 = xlsx.utils.sheet_to_json(workbook.Sheets['Hoja2']);

        if (hoja1.length > 0) {
            await db.collection('ventas').deleteMany({});
            await db.collection('ventas').insertMany(hoja1);
        }

        if (hoja2.length > 0) {
            await db.collection('stock').deleteMany({});
            await db.collection('stock').insertMany(hoja2);
        }

        console.log("✅ Datos cargados en MongoDB correctamente");
    } catch (error) {
        console.error("❌ Error cargando datos:", error);
    } finally {
        await client.close();
        console.log("🔌 Desconectado de MongoDB");
    }
})();
