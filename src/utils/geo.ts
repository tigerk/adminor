import { getCityByLocation } from "@/api/region";

export const getLocationAndCity = async () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;

        const res = await getCityByLocation({ lon: longitude, lat: latitude });
        if (res.code === 0) {
          if (res.data) {
            console.log("获取到的城市ID:", res.data);
            localStorage.setItem("currentCityId", res.data.id);
            localStorage.setItem("currentCityName", res.data.name);
          }
        }
      },
      error => {
        console.error("获取地理位置失败", error);
      }
    );
  } else {
    console.log("您的浏览器不支持Geolocation");
  }
};
