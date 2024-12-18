import BASE_URL from "../baseUrl";

export async function getLanguages(): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/getListOfLanguages`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const languages = await response.json();
  return languages;
}
