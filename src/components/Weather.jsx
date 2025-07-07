import { useState, useRef } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import './Weather.css';
import search_icon from '../assets/search.png';
import clear_icon from '../assets/clear.png';
import cloud_icon from '../assets/cloud.png';
import drizzle_icon from '../assets/drizzle.png';
import humidity_icon from '../assets/humidity.png';
import rain_icon from '../assets/rain.png';
import snow_icon from '../assets/snow.png';
import wind_icon from '../assets/wind.png';

const Weather = () => {
  const inputRef = useRef(null);

  const [weatherData, setWeatherData] = useState(false);
  const [forecast, setForecast] = useState(false);

  const allIcons = {
    "01d": clear_icon,
    "01n": clear_icon,
    "02d": cloud_icon,
    "02n": cloud_icon,
    "03d": cloud_icon,
    "03n": cloud_icon,
    "04d": drizzle_icon,
    "04n": drizzle_icon,
    "09d": rain_icon,
    "09n": rain_icon,
    "10d": rain_icon,
    "10n": rain_icon,
    "13d": snow_icon,
    "13n": snow_icon
  };

  const search = async (city) => {
    if (city === "") {
      alert("Enter city name");
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;

      let response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        alert(data.message.charAt(0).toUpperCase() + data.message.slice(1));
        return;
      }

      const icon = allIcons[data.weather[0].icon] || clear_icon;
      setWeatherData({
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        temperature: Math.round(data.main.temp),
        location: data.name,
        icon
      });

      // Forecast logic

      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${import.meta.env.VITE_APP_ID}&units=metric`;

      response = await axios.get(forecastUrl);
      const forecastData = response.data;

      const dt_txt_array = [];
      forecastData.list.forEach((forecast3Hr) => {
        dt_txt_array.push(forecast3Hr.dt_txt.split(' ')[0]);
      });

      const uniqueArray = [...new Set(dt_txt_array)];

      let totalTemp = 0;
      let counter = 0;
      const forecastDataArray = [];
      const descriptions = [];
      const forecastDescriptions = [];

      // Find the average temperature per day
      uniqueArray.forEach((dt_txt) => {
        const forecastContainer = forecastData.list.filter((forecast3Hr) => {
          return forecast3Hr.dt_txt.split(' ')[0] === dt_txt;
        });

        forecastContainer.forEach((forecast) => {
          totalTemp += forecast.main.temp;
          counter++;

          const description = {};
          description[`${dt_txt}`] = forecast.weather[0].icon;
          descriptions.push(description);
        });

        const avgTemp = totalTemp / counter;
        forecastDataArray.push(avgTemp);
        counter = 0;
        totalTemp = 0;
      });

      // Find the most frequently occuring weather description per day
      uniqueArray.forEach((dt_txt) => {
        const filteredDescriptions = descriptions.filter((description) => {
          return dt_txt in description;
        });

        const descriptionsContainer = [];

        filteredDescriptions.forEach((description) => {
          descriptionsContainer.push(description[`${dt_txt}`]);
        });

        const counts = {};
        let mostFrequentDescription;
        let maxCount = 0;

        for (const element of descriptionsContainer) {
          counts[element] = (counts[element] || 0) + 1;

          if (counts[element] > maxCount) {
            maxCount = counts[element];
            mostFrequentDescription = element;
          }
        }

        forecastDescriptions.push(mostFrequentDescription);
      });
      if (forecastDataArray.length === 6) {
        forecastDataArray.pop();
      }
      if (forecastDescriptions.length === 6) {
        forecastDescriptions.pop();
      }
      setForecast({
        temperatures: forecastDataArray,
        descriptions: forecastDescriptions,
        dates: uniqueArray
      });
    } catch {
      setWeatherData(false);
      setForecast(false);
      console.error("Error in fetching weather data");
    }
  };

  return (
    <>
      <div className="weather">
        <div className="search-bar">
          <input ref={inputRef} type="text" placeholder="Enter city name" onKeyDown={(event) => {
            if (event.key === 'Enter') {
              search(inputRef.current.value);
              inputRef.current.value = '';
            }
          }} />
          <img src={search_icon} onClick={() => {
            search(inputRef.current.value);
          }} />
        </div>
        {weatherData ?
          <>
            <p className="date">{dayjs(weatherData.dt).format('ddd')}</p>
            <img src={weatherData.icon} className='weather-icon' />
            <p className='temperature'>{weatherData.temperature}&#176;C</p>
            <p className='location'>{weatherData.location}</p>
            <div className='weather-data'>
              <div className="col">
                <img src={humidity_icon} />
                <div>
                  <p>{weatherData.humidity}%</p>
                  <span>Humidity</span>
                </div>
              </div>
              <div className="col">
                <img src={wind_icon} />
                <div>
                  <p>{weatherData.windSpeed} km/h</p>
                  <span>Wind Speed</span>
                </div>
              </div>
            </div>
          </>
          : <></>}
      </div>
      <div className="forecast-row">
        {forecast && (
          forecast.temperatures.map((temperature, index) => {
            return (
              <div className="weather">
                <p className="date">{dayjs(forecast.dates[index]).format('ddd')}</p>
                <img src={allIcons[forecast.descriptions[index]]} className='weather-icon' />
                <p className='temperature'>{Math.round(temperature)}&#176;C</p>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

export default Weather;