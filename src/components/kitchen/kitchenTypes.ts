export interface KitchenOrder {
  id: string;
  order_number: number;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
    modifiers?: string[];
  }>;
  kitchen_status: 'pending' | 'preparing' | 'ready' | 'served';
  kitchen_notes?: string;
  kitchen_started_at?: string;
  kitchen_ready_at?: string;
  created_at: string;
  order_type: string;
  table_id?: string;
}

export const playKitchenNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new Ctx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    });
  } catch {
    /* ignore */
  }
};

export const getKitchenStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'preparing': return 'Preparando';
    case 'ready': return 'Listo';
    case 'served': return 'Servido';
    default: return status;
  }
};
