// app/api/search/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || "Movie";
  const apiKey = process.env.API_KEY;  // Server-side environment variable

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${query}&page=1&include_adult=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    const data = await response.json();

    // Check if data.results is defined and is an array
    if (!Array.isArray(data.results)) {
      throw new Error('Invalid data structure: results is not an array');
    }

    if (data.results.length > 0) {
      const results = data.results.slice(0, 30).map((movie: {
        known_for: { poster_path: string; }[];
        backdrop_path: string;
        first_air_date: string;
        original_name: string;
        name: string;
        id: number;
        poster_path: string;
        title: string;
        overview: string;
        release_date: string;
        media_type: string;
      }) => ({
        id: movie.id,
        url: movie?.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : movie?.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
            : movie?.known_for?.[0]?.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.known_for[0].poster_path}`
              : "https://via.placeholder.com/200x300", // Fallback placeholder
        title: movie.title || movie.name || movie.original_name || movie || "Untitled",
        overview: movie.overview || movie.first_air_date || "No description available.",
        release_date: movie.release_date || movie.first_air_date || "Unknown release date",
        media_type: movie.media_type,
      }));

      return NextResponse.json(results);
    } else {
      return NextResponse.json([]); // Return an empty array if no results are found
    }
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json({ error: "Error fetching results" }, { status: 500 });
  }
}
