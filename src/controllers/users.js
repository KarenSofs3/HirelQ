import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

export const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUser = new User({
      nombre,
      email,
      password: hashedPassword,
      rol: "candidato", // Rol por defecto
    });

    await newUser.save();

    // Retornar respuesta sin contraseña
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: newUser._id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y contraseña son obligatorios" });
    }

    // Buscar usuario
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Comparar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const accessTokenSecret =
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!accessTokenSecret || !refreshTokenSecret) {
      console.error("Faltan secretos de JWT en las variables de entorno.");
      return res
        .status(500)
        .json({ message: "Configuración de autenticación incorrecta" });
    }

    const accessToken = jwt.sign(
      { id: user._id, rol: user.rol },
      accessTokenSecret,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user._id, rol: user.rol },
      refreshTokenSecret,
      { expiresIn: "7d" },
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token requerido" });
    }

    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    const accessTokenSecret =
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

    if (!refreshTokenSecret || !accessTokenSecret) {
      console.error("Faltan secretos de JWT en las variables de entorno.");
      return res
        .status(500)
        .json({ message: "Configuración de autenticación incorrecta" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, refreshTokenSecret);
    } catch (err) {
      console.error("Refresh token inválido o expirado:", err);
      return res
        .status(403)
        .json({ message: "Refresh token inválido o expirado" });
    }

    const { id, rol } = payload;

    // Verificar que el refreshToken coincida con el guardado en BD
    const user = await User.findById(id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Refresh token no autorizado" });
    }

    const newAccessToken = jwt.sign({ id, rol }, accessTokenSecret, {
      expiresIn: "15m",
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error en refresh token:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token requerido" });
    }

    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!refreshTokenSecret) {
      console.error("Faltan secretos de JWT en las variables de entorno.");
      return res
        .status(500)
        .json({ message: "Configuración de autenticación incorrecta" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, refreshTokenSecret);
    } catch (err) {
      console.error("Refresh token inválido o expirado:", err);
      return res
        .status(403)
        .json({ message: "Refresh token inválido o expirado" });
    }

    const { id } = payload;

    // Buscar usuario y verificar que el refreshToken coincida
    const user = await User.findById(id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Refresh token no autorizado" });
    }

    // Invalidar el refreshToken
    user.refreshToken = null;
    await user.save();

    res.json({ message: "Logout exitoso" });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 6 caracteres",
      });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "La nueva contraseña debe ser diferente a la actual",
      });
    }
    const user = await User.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Contraseña actual incorrecta" });
    }

    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getMe = async (req, res) => {
  try {
    const { id } = req.user;

    // Buscar usuario excluyendo campos sensibles
    const user = await User.findById(id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
  } catch (error) {
    console.error("Error en getMe:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
