# Juego de Compuertas Lógicas con Control de Administrador

Este proyecto es un juego educativo que enseña conceptos básicos de compuertas lógicas (AND, OR, NOT) con un sistema de administración en tiempo real.

## Configuración

1. **Firebase**:
   - Crea un proyecto en Firebase Console (https://console.firebase.google.com/)
   - Configura Firestore en modo de prueba
   - Copia tu configuración de Firebase al archivo `script.js` y `admin.js`

2. **EmailJS**:
   - Crea una cuenta en EmailJS (https://www.emailjs.com/)
   - Configura los templates con los IDs proporcionados en los requisitos
   - Copia tu User ID al inicializar EmailJS en `script.js`

3. **Despliegue**:
   - Puedes desplegar este proyecto en GitHub Pages, Firebase Hosting o cualquier servicio de hosting estático

## Funcionalidades

### Para Jugadores:
- Registro con nombre y correo electrónico
- Sistema de niveles progresivos con compuertas lógicas
- Temporizador visible
- Recepción de resultados por correo electrónico

### Para Administradores:
- Control total del juego en tiempo real
- Inicio/finalización del juego
- Ajuste de temporizador
- Control de niveles globales
- Monitoreo de jugadores conectados
- Estadísticas en tiempo real
- Expulsión/reinicio de jugadores

## Estructura de Archivos

- `index.html`: Interfaz principal del juego
- `admin.html`: Panel de control del administrador
- `styles.css`: Estilos CSS para ambas interfaces
- `script.js`: Lógica principal del juego
- `admin.js`: Lógica del panel de administración

## Tecnologías Utilizadas

- HTML5, CSS3, JavaScript
- Firebase (Firestore, Authentication)
- EmailJS (para envío de correos)