import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardar payload en req.user
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Verificar si req.user existe
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Convertir a array si es un string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Verificar si el rol del usuario está permitido
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    next();
  };
};
