import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import morgan from 'morgan';
import companiesRoutes from './routes/companies.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.static('public'));

// Rutas
app.use('/companies', companiesRoutes);

app.get('/life', (req, res) => res.send('server running'));

app.use('*', (req, res) => res.status(404).json({ message: 'Page not found' }));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB conectado');
        app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
    })
    .catch((error) => console.error('Error al conectar a MongoDB:', error));


app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));