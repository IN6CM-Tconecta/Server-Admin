import jwt from 'jsonwebtoken';

export const validateJWT = (req, res, next) => {
    // Extraemos el token del header Authorization (Bearer token) o token
    const token = req.header('token') || req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No hay token en la petición' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Extraer Rol (Manejando los claims estándar de .NET o Node)
        const userRole = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';

        // Inyectamos la información del token decodificado en la request
        req.userRole = userRole;
        req.postgresUserId = decoded.sub || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        req.userEmail = decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

        next();
    } catch (error) {
        console.log("Error de JWT en Server-Admin:", error.message);
        res.status(401).json({ success: false, message: 'Token no válido o expirado' });
    }
};

export const requireAdminRole = (req, res, next) => {
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado - Se requiere rol de Administrador para realizar cambios en la infraestructura' 
        });
    }
    next();
};