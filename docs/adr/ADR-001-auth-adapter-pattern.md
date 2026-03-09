# ADR-001: Patrón de Adaptador para Autenticación e Integraciones

## Estatus
Propuesto / En Implementación

## Contexto
Actualmente, la aplicación **Carrera LTI** está fuertemente acoplada al SDK de Firebase. Los hooks de React (como `useCloudSync`) y las utilidades importan tipos y funciones directamente de `firebase/auth` y `firebase/firestore`. Esto presenta varios problemas:
1. **Dificultad de Testing**: Es complejo mockear el SDK global de Firebase en tests unitarios.
2. **Vendor Lock-in**: Migrar a otra solución (ej. Auth0, Supabase, Clerk) requeriría modificar múltiples archivos en toda la aplicación.
3. **Fugas de Abstracción**: Lógica de infraestructura (como el manejo de errores de Firebase) se filtra en la capa de UI.

## Decisión
Adoptaremos el **Patrón de Adaptador** para desacoplar el núcleo de la aplicación de los proveedores de servicios externos.

1. Se definirá una interfaz genérica `IAuthService` que describa las capacidades necesarias (login anónimo, estado de auth, sync de datos).
2. Se implementará un `FirebaseAuthService` que cumpla con esta interfaz.
3. Los hooks utilizarán inyección de dependencias o un singleton del servicio agnóstico.

## Consecuencias
- **Positivas**: Mayor testeabilidad, facilidad para cambiar de proveedor, código más limpio en la capa de UI.
- **Neutras**: Ligero incremento inicial en la cantidad de archivos (interfaces y clases de servicio).
- **Negativas**: Ninguna identificada para la escala actual.
