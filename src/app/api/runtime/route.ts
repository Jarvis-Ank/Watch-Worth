// app/api/runtime/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  const type = searchParams.get('type');

  if (!uid || !type) {
    return NextResponse.json({ error: "Missing uid or type" }, { status: 400 });
  }

  const apiKey = process.env.API_KEY; // Server-side environment variable
  const url = `https://api.themoviedb.org/3/${type}/${uid}?api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    const data = await response.json();

    let totalRuntimeMinutes = 0;

    if (type === "tv" && data.episode_run_time.length > 1) {
      // Calculate average episode runtime if episode_run_time is an array
      const avgEpisodeRuntime =
        Array.isArray(data.episode_run_time) && data.episode_run_time.length
          ? data.episode_run_time.reduce((a: number, b: number) => a + b, 0) /
            data.episode_run_time.length
          : 0;

      const numberOfEpisodes = Number(data.number_of_episodes) || 0;

      // Calculate total runtime for TV shows based on the average episode runtime
      totalRuntimeMinutes = avgEpisodeRuntime * numberOfEpisodes;

      console.log(
        `TV Show: ${data.original_name} | Episodes: ${numberOfEpisodes} | Total Runtime (mins): ${totalRuntimeMinutes}`
      );
    } else {
      totalRuntimeMinutes = Number(data.runtime) || 0;

      console.log(
        `Movie: ${data.original_title} | Runtime (mins): ${totalRuntimeMinutes}`
      );
    }

    // Convert total runtime to DD:HH:MM format
    const runTimeDays = convertMinutesToDDHHMM(totalRuntimeMinutes);

    console.log(
      `Runtime: ${runTimeDays.DD} days, ${runTimeDays.HH} hours, ${runTimeDays.MM} minutes`
    );

    return NextResponse.json({ totalRuntimeMinutes, runTimeDays });
  } catch (error) {
    console.error("Error fetching runtime data:", error);
    return NextResponse.json({ error: "Error fetching runtime data" }, { status: 500 });
  }
}

// Helper function to convert minutes to DD:HH:MM format
function convertMinutesToDDHHMM(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return { DD: days, HH: hours, MM: mins };
}
