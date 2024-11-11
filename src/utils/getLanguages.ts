export async function getLanguages(): Promise<any[]> {
    const response = await fetch('http://localhost:3001/getListOfLanguages');

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const languages = await response.json();
    return languages;
}
