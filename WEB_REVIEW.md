# Revisión web de ElectroLab

Abre http://127.0.0.1:8083 en esta computadora. La API de revisión está en http://127.0.0.1:4100/api y usa la base separada `electrolab_web_review`.

Los accesos de cliente, administradores y trabajadores están en `releases/web-review-access.json`. Ese archivo está excluido de Git; no lo publiques. El catálogo de revisión contiene 20 productos y sus SKU.

## Recorrido de revisión

1. En inventario, cambia ES a EN y vuelve a cargar la página: el idioma debe conservarse. Revisa también los mensajes de formularios.
2. Como administrador o trabajador, abre Perfil → SKU registrados. Crea y edita un SKU; selecciónalo al crear un producto. Un SKU utilizado no se puede eliminar. Cambiar su código actualiza el producto relacionado.
3. Como administrador, abre el historial y alterna entre ventas y reembolsos, también al cargar más registros. Los estados desconocidos deben mostrarse sin cerrar la pantalla.
4. Como cliente, abre una compra del historial y solicita un reembolso con cita física. El calendario impide hoy y fechas anteriores. Elige mañana: las 10:00 aparecen ocupadas por un registro de demostración. Los turnos duran 20 minutos, desde 09:00 hasta 17:40 (terminan a las 18:00), en horario de Ciudad de México.
5. Reserva otro turno y comprueba que queda ocupado. Al rechazar la solicitud desde la cuenta administradora, el turno vuelve a estar disponible.
6. Revisa el nombre ElectroLab, el favicon y la adaptación a ventanas estrechas. Los iconos nativos del ZIP están configurados para la futura compilación.

Los correos de esta instancia de revisión no se envían: los códigos de recuperación se registran en la consola del backend. Los cambios de datos durante esta revisión no afectan a la base de producción.

## Validación realizada

- 10 pruebas de frontend y 8 de backend aprobadas.
- Pruebas de integración aprobadas para permisos, CRUD de SKU, control de versiones, reservas simultáneas, disponibilidad e historial.
- Exportación web completada, API saludable y servidor web con respuesta HTTP 200.
- La revisión visual automatizada quedó pendiente: Computer Use se detuvo porque Firefox para Windows no admite la comprobación de políticas de navegación de la herramienta. Hace falta revisión visual manual.

## Reiniciar la revisión local

En `backend`, ejecuta `npm run review:start`. Si necesitas preparar de nuevo los datos de demostración, usa antes `npm run review:prepare` (requiere conexión a MongoDB Atlas).

En la raíz del proyecto, ejecuta `python -m http.server 8083 --bind 127.0.0.1 --directory frontend/review-dist`.

Para regenerar la web desde PowerShell, dentro de `frontend`:

```powershell
$env:EXPO_PUBLIC_API_URL='http://127.0.0.1:4100/api'
npx.cmd --yes @expo/agent-cli@latest export --platform web --output-dir review-dist --clear
Remove-Item Env:EXPO_PUBLIC_API_URL
```

La revisión manual fue aprobada por el usuario el 17 de noviembre de 2026. La entrega pasa a publicación de la API y compilaciones nativas 0.2.0. Para iOS, sigue prevista una compilación para simulador; un workflow de GitHub no sustituye la firma y membresía de Apple necesarias para distribuir a dispositivos.
