export interface ProcessMessage {
  message: string;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
}

export async function fetchProcessMessage(): Promise<ProcessMessage | null> {
  try {
    const response = await fetch('http://localhost:8080/etendo/meta/message', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error en respuesta:', response.status);
      return null;
    }

    const data = await response.json();

    if (data) {
      if (data.message === 'No message found') {
        return null;
      }

      let messageType = data.type?.toLowerCase() || 'info';

      if (data.message && data.message.toUpperCase().includes('ERROR')) {
        messageType = 'error';
      }

      const normalizedType =
        messageType === 'success' || messageType.includes('success')
          ? 'success'
          : messageType === 'error' || messageType.includes('error')
            ? 'error'
            : messageType === 'warning' || messageType.includes('warn')
              ? 'warning'
              : 'info';

      return {
        message: data.message || '',
        type: normalizedType as 'success' | 'error' | 'warning' | 'info',
        title: data.title || (normalizedType === 'error' ? 'Error' : 'Mensaje del proceso'),
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener mensajes del proceso:', error);
    return null;
  }
}
