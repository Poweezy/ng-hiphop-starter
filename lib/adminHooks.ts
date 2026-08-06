export async function patchDisplayUntil(resource: 'quotes' | 'graffiti', id: string, date: string | null) {
    const res = await fetch(`/api/${resource}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, display_until: date }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || data.message || 'Update failed');
    }
    return res.json();
}
