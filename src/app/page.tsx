'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const Page = () => {
  const [images, setImages] = useState<
    { id: number; url: string; title: string; overview: string; release_date: string; media_type: string }[]
  >([]);
  const [selectedMovie, setSelectedMovie] = useState<{
    title: string;
    overview: string;
    posterUrl: string;
    releaseDate: string;
    media_type: string;
  } | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<
    { id: number; title: string; release_date: string; runtime: number; runtimeFormated: { MM: number; DD: number; HH: number; } }[]
  >([]);


  const apiKey = process.env.API_KEY;



  const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const positionImages = () => {
    const container = document.getElementById('imageContainer');
    const searchBox = document.querySelector('.search-container');
    if (!container || !searchBox) return;

    const containerRect = container.getBoundingClientRect();
    const searchBoxRect = searchBox.getBoundingClientRect();
    const existingRects: DOMRect[] = []; // Store positions of all placed images

    images.forEach((image, index) => {
      const imgElement = document.getElementById(`img-${index}`);
      if (!imgElement) return;

      const size = getRandomInt(100, 200); // Random width between 100px and 200px
      imgElement.style.width = `${size}px`;
      imgElement.style.height = 'auto'; // Maintain aspect ratio

      let attempts = 0;
      let placed = false;

      while (!placed && attempts < 100) {
        const left = getRandomInt(
          containerRect.left + 10,
          containerRect.right - size - 10
        );
        const top = getRandomInt(
          containerRect.top + 10,
          containerRect.bottom - size * 1.5 - 10 // Adjusted for aspect ratio
        );

        const newRect = new DOMRect(left, top, size, size * 1.5); // 2:3 aspect ratio
        const isOverlapping = existingRects.some(
          (rect) =>
            !(newRect.right < rect.left ||
              newRect.left > rect.right ||
              newRect.bottom < rect.top ||
              newRect.top > rect.bottom)
        );

        const isInsideSearchBox =
          left < searchBoxRect.right &&
          left + size > searchBoxRect.left &&
          top < searchBoxRect.bottom &&
          top + size * 1.5 > searchBoxRect.top;

        if (!isOverlapping && !isInsideSearchBox) {
          imgElement.style.left = `${left - containerRect.left}px`;
          imgElement.style.top = `${top - containerRect.top}px`;

          existingRects.push(newRect);
          placed = true;
        }

        attempts++;
      }

      if (!placed) {
        console.warn(`Failed to place image ${index} without overlap.`);
      }
    });
  };

  useEffect(() => {
    if (images.length > 0) {
      positionImages();
    }
  }, [images]);

  const handleImageClick = (movie: {
    title: string;
    overview: string;
    url: string;
    release_date: string;
    media_type: string;
  }) => {
    setSelectedMovie({
      title: movie.title,
      overview: movie.overview,
      posterUrl: movie.url,
      releaseDate: movie.release_date,
      media_type: movie.media_type,
    });
  };

  useEffect(() => {
    handleSearch(); // Fetch default images on initial load
  }, []);

  const handleSearch = async (query: string = "Movie") => {
    try {
      const response = await fetch(`/api/search?query=${query}`);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();

      console.log(query ? "Search Results: " : "Default Results: ", data);

      setImages(data);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  const handleAddToNav = async (movie: {
    id: number;
    url: string;
    title: string;
    overview: string;
    release_date: string;
    media_type: string; // Add `type` to determine if it's a movie or TV show
  }) => {
    console.log("---> " + movie.media_type + " []>>>>" + movie.id);
    if (!selectedMovies.some((selected) => selected.id === movie.id)) {
      try {
        // Fetch runtime using the optimized getRunTime function
        const runtime = await getRunTime(movie.id, movie.media_type);
        const runtimeFormated = await convertMinutesToDDHHMM(runtime);
        // Add the movie/TV show to the selected list with runtime
        setSelectedMovies((prev) => [
          ...prev,
          {
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            runtime,
            runtimeFormated, // Add runtime to the object
            type: movie.media_type,
          },
        ]);
      } catch (error) {
        console.error(`Error fetching runtime for ${movie.title} (ID: ${movie.id}):`, error);
      }
    }
  };


  const handleRemoveFromNav = (id: number) => {
    setSelectedMovies((prev) => prev.filter((movie) => movie.id !== id));
  };
  // Fetch and Calculate Run Time of Movie/Series

  const getRunTime = async (uid: number, type: string) => {
    try {
      const response = await fetch(`/api/runtime?uid=${uid}&type=${type}`);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();

      const totalRuntimeMinutes = data.totalRuntimeMinutes;
      const runTimeDays = data.runTimeDays;

      console.log(
        `Runtime: ${runTimeDays.DD} days, ${runTimeDays.HH} hours, ${runTimeDays.MM} minutes`
      );

      return totalRuntimeMinutes; // Return total runtime in minutes for further use
    } catch (error) {
      console.error("Error fetching runtime data:", error);
      return 0; // Default to 0 if an error occurs
    }
  };

  // Convert Minutes to DD:HH:MM Format
  const convertMinutesToDDHHMM = (minutes: number) => {
    const days = Math.floor(minutes / 1440); // Calculate days
    const remainingMinutesAfterDays = minutes % 1440;

    const hours = Math.floor(remainingMinutesAfterDays / 60); // Calculate hours
    const remainingMinutes = remainingMinutesAfterDays % 60; // Calculate minutes

    return {
      DD: days,
      HH: hours,
      MM: remainingMinutes,
    };
  };

  /* Total Tinme  */
  const calculateTotalRuntime = () => {
    return convertMinutesToDDHHMM(selectedMovies.reduce((total, movie) => total + movie.runtime, 0));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Hamburger Button */}
      <button
        className="absolute top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-md shadow-md"
        onClick={() => setIsNavOpen(!isNavOpen)}
      >
        <div className="space-y-1">
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </div>
      </button>

      {/* Side Navigation */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-gray-800 text-white shadow-lg transition-transform duration-300 ${isNavOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="sticky p-4 border-b border-gray-700 z-10">
          <h3 className="text-lg font-bold text-white ">Selected {selectedMovies.length}</h3>
          <p className="text-sm text-gray-400">Total Time:  {calculateTotalRuntime().DD} Days {calculateTotalRuntime().HH} Hours {calculateTotalRuntime().MM} Mins</p>
        </div>

        <div className="overflow-y-auto max-h-full">
          <ul className="mt-8 space-y-4 p-4 pb-20 pt-0">
            {selectedMovies.map((movie) => (
              <li
                key={movie.id}
                className="flex justify-between items-center border-b border-gray-700 pb-2"
              >
                <div>
                  <h3 className="text-lg">{movie.title}</h3>
                  <p className="text-sm text-gray-400">
                    {movie.release_date} |
                    {movie.runtimeFormated.MM != 0 ?
                      `Runtime: ${movie.runtimeFormated.DD} days, ${movie.runtimeFormated.HH} hours, ${movie.runtimeFormated.MM} minutes`
                      : `Run time unavailable`}
                  </p>
                </div>
                <button
                  className="text-red-500 text-lg"
                  onClick={() => handleRemoveFromNav(movie.id)}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>


      <div></div>
      <div
        className={`search-container w-full md:w-[60%] absolute top-10 left-1/2 transform -translate-x-1/2 p-4 rounded shadow z-50  ${isNavOpen ? 'translate-x-[-256px]' : ''
          }`}
      >
        <input
          type="text"
          placeholder="Search movies, TV shows..."
          className="w-full md:w-[60%] px-4 py-2 text-gray-900 bg-gray-100 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-500"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div
        id="imageContainer"
        className={` px-20 py-40 left-10 right-10 w-full h-full overflow-hidden ${isNavOpen ? 'translate-x-[-256px]' : ''
          }`}
      >
        {images.map((image, index) => {
          const isSelected = selectedMovies.some((movie) => movie.id === image.id);

          return (
            <div key={index} id={`img-${index}`} className="absolute w-fit h-fit transition-transform duration-200 hover:scale-110 hover:z-20 cursor-pointer" >
              <Image
                src={image.url}
                alt={image.title}
                width={300} // Set a default width
                height={450} // Set a default height
                className={`rounded-lg object-cover w-full h-full transition-transform duration-200 group-hover:scale-105 ${isSelected ? 'shadow-[0_0_0_3px_rgba(0,255,0,1)]' : 'shadow-none'
                  }`} onClick={() => handleImageClick(image)}
                layout="responsive" // Ensures the image maintains its aspect ratio
              />
              <button
                className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("1] " + image + "2] " + image.media_type);
                  handleAddToNav(image);
                }}
              >
                +
              </button>
            </div>
          );
        })}
      </div>

      {selectedMovie && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setSelectedMovie(null)}
        >
          <div
            className="bg-white p-4 rounded shadow-lg w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedMovie.posterUrl}
              alt={selectedMovie.title}
              width={300} // Set a default width
              height={450} // Set a default height
              className="w-full rounded"
            />
            <h2 className="text-xl font-bold text-black mt-4">{selectedMovie.title}</h2>
            <p className="text-sm text-white mt-1">Release Date: {selectedMovie.releaseDate}</p>
            <p className="text-gray-700 mt-2 line-clamp-2">{selectedMovie.overview}</p>

          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
