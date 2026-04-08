import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import morgan from 'morgan';
import companiesRoutes from './routes/companies.js';
import usersRoutes from './routes/users.js';
import jobPositionsRoutes from './routes/job_positions.js';
import { authenticate, requireRole } from './middlewares/webToken.js';

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
app.use('/auth', usersRoutes);
app.use('/api/v1/positions', jobPositionsRoutes);

app.get('/life', (req, res) => res.send('server running'));

app.get('/protected', authenticate, (req, res) => {
    res.json({
        message: 'Acceso permitido',
        user: req.user
    });
});

// Ejemplo de ruta con requireRole
app.get('/admin-only', authenticate, requireRole('admin'), (req, res) => {
    res.json({
        message: 'Acceso exclusivo para administradores',
        user: req.user
    });
});

app.get('/empresa-or-admin', authenticate, requireRole(['admin', 'empresa']), (req, res) => {
    res.json({
        message: 'Acceso para administradores o empresas',
        user: req.user
    });
});

app.use((req, res) => res.status(404).json({ message: 'Page not found' }));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB conectado');
        app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
    })
    .catch((error) => console.error('Error al conectar a MongoDB:', error));

