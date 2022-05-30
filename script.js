let coords = [];

let positions = [];
let markers = [];

let marker_search_arr = [];
let marker_cctv_arr = [];
let counter = 0;

// 검색 결과 중 선택된 마커와 그 마커의 좌표
let marker_selected;
let selected_position;
let marker_selectedArr = [];

// 경로 도형을 저장하는 어레이
let line_info_arr = [];
let line_result_arr = [];

// 보행자 경로 포인트 마커 (경로 선이 꺾이는 지점)
let marker_points;
let marker_points_arr = [];

// 앱을 켠 순간의 현재 위치 좌표
let current_position;
let lat_current;
let lon_current;

let lat_clicked;
let lon_clicked;

const expected = document.getElementById("result");

// 검색을 통해 목적지를 정했는지 판단
let searched = false;

let map = new Tmapv2.Map("TMapApp", {
  center: new Tmapv2.LatLng(37.59644996896789, 127.06004762649577),
  width: "100%",
  height: "100%",
  zoom: 18,
});

axios
  .get("http://127.0.0.1:8000/cctv/")
  .then((response) => {
    coords = [...response.data];

    coords.forEach((e, i) => {
      let lat = Number(e.latitude);
      let lon = Number(e.longtitude);
      let name = e.address;

      let markerPosition = new Tmapv2.LatLng(lat, lon);

      //Marker 객체 생성.
      const marker_cctv = new Tmapv2.Marker({
        position: markerPosition, //Marker의 중심좌표 설정.
        icon: "https://cdn2.iconfinder.com/data/icons/wsd-map-markers-2/512/wsd_markers_89-1024.png",
        iconSize: new Tmapv2.Size(24, 24),
        map: map, //Marker가 표시될 Map 설정.
        title: name, //Marker 타이틀.
        index: i,
      });
      marker_cctv.setMap(map);
      marker_cctv_arr.push(marker_cctv);
    });
  })
  .catch(function (error) {
    console.log(error);
  });

//------ 현재 위치에 마커 생성 ------//
//------ 외대를 시작위치로 임시 설정 ------//
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    // lat_current = position.coords.latitude;
    // lon_current = position.coords.longitude;
    lat_current = 37.59644996896789;
    lon_current = 127.06004762649577;
    current_position = new Tmapv2.LatLng(lat_current, lon_current);
    let marker_s = new Tmapv2.Marker({
      position: current_position,
      icon: "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png",
      iconSize: new Tmapv2.Size(24, 38),
      draggable: true,
      map: map,
    });
    map.setCenter(new Tmapv2.LatLng(lat_current, lon_current));
    map.setZoom(18);
  });
}

//------ 클릭시 마커 생성 ------//

map.addListener("click", (e) => {
  searched = false;
  removeLine();
  removeMarkers();

  lat_clicked = e.latLng.lat();
  lon_clicked = e.latLng.lng();

  let marker_e = new Tmapv2.Marker({
    position: new Tmapv2.LatLng(lat_clicked, lon_clicked), //Marker의 중심좌표 설정.
    icon: "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_e.png",
    iconSize: new Tmapv2.Size(24, 38),
    map: map,
  });
  markers.push(marker_e);
});
//------ --------- ------//

//------ 명칭 검색 후 마커 생성 ------//
$("#btn_select").on("click", () => {
  let searchKeyword = $("#searchKeyword").val();
  removeLine();
  removeMarkers();

  axios({
    method: "GET",
    url: "https://apis.openapi.sk.com/tmap/pois?version=1&format=json&callback=result",
    async: false,
    // axios는 get으로 파라미터 전달 시 data 대신 params를 써야
    params: {
      appKey: "l7xx2eff6322cd2944cab62446d299f7f6e3",
      searchKeyword: searchKeyword,
      resCoordType: "EPSG3857",
      reqCoordType: "WGS84GEO",
      count: 10,
    },
  }).then((response) => {
    let resultpoisData = response.data.searchPoiInfo.pois.poi;
    counter++;

    removeSearchMarkers();

    let positionBounds = new Tmapv2.LatLngBounds();

    resultpoisData.forEach((e, i) => {
      let noorLat = Number(e.noorLat);
      let noorLon = Number(e.noorLon);
      let name = e.name;

      let pointCng = new Tmapv2.Point(noorLon, noorLat);
      let projectionCng = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
        pointCng
      );

      let lat = projectionCng._lat;
      let lon = projectionCng._lng;

      let markerPosition = new Tmapv2.LatLng(lat, lon);

      let marker_search = new Tmapv2.Marker({
        position: markerPosition,

        icon:
          "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_" +
          i +
          ".png",
        iconSize: new Tmapv2.Size(24, 38),
        title: name,
        map: map,
        index: i,
      });

      marker_search.index = i;

      marker_search.addListener("click", () => {
        searched = true;
        selected_position = marker_search.getPosition();
        removeMarkers();
        removeSearchMarkers();
        console.log(selected_position);
        marker_selected = new Tmapv2.Marker({
          position: selected_position,

          icon: "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_e.png",

          iconSize: new Tmapv2.Size(24, 38),
          title: name,
          map: map,
          index: i,
        });
        marker_selectedArr.push(marker_selected);
      });
      marker_search_arr.push(marker_search);
      positionBounds.extend(markerPosition); // LatLngBounds의 객체 확장
    });

    map.panToBounds(positionBounds); // 확장된 bounds의 중심으로 이동시키기
    map.zoomOut();
  });
});

//-------//

//------ 가까운 파출소 ------//
$("#btn_police").on("click", () => {
  searched = true;
  removeLine();
  removeMarkers();

  $.ajax({
    method: "GET", // 요청 방식
    url: "https://apis.openapi.sk.com/tmap/pois/search/around?version=1&format=json&callback=result", // url 주소
    data: {
      categories: "파출소",
      resCoordType: "EPSG3857",
      searchType: "name",
      searchtypCd: "A",
      radius: 1,
      reqCoordType: "WGS84GEO",
      centerLon: lon_current,
      centerLat: lat_current,
      appKey: "l7xx2eff6322cd2944cab62446d299f7f6e3",
      count: 20,
    },
    success: (response) => {
      counter++;
      let resultpoisData = response.searchPoiInfo.pois.poi;

      // 2. 기존 마커, 팝업 제거
      removeSearchMarkers();

      let positionBounds = new Tmapv2.LatLngBounds(); //맵에 결과물 확인 하기 위한 LatLngBounds객체 생성

      let minDi = 99999;
      let finalPosition;
      let markerPosition;
      let name;
      // 3. POI 마커 표시
      resultpoisData.forEach((e) => {
        let noorLat = Number(e.noorLat);
        let noorLon = Number(e.noorLon);
        name = e.name;

        let pointCng = new Tmapv2.Point(noorLon, noorLat);
        let projectionCng = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
          pointCng
        );

        let lat = projectionCng._lat;
        let lon = projectionCng._lng;

        markerPosition = new Tmapv2.LatLng(lat, lon);
        let di = current_position.distanceTo(markerPosition);

        if (di < minDi) {
          minDi = di;
          finalPosition = markerPosition;
        }
      });

      let marker_search = new Tmapv2.Marker({
        position: markerPosition,
        //icon : "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_a.png",
        icon: "https://cdn2.iconfinder.com/data/icons/wsd-map-markers-2/512/wsd_markers_65-1024.png",
        iconSize: new Tmapv2.Size(38, 38),
        map: map,
      });

      marker_search.addListener("click", () => {
        searched = true;
        selected_position = marker_search.getPosition();
        removeMarkers();
        removeSearchMarkers();
        console.log(selected_position);
        marker_selected = new Tmapv2.Marker({
          position: selected_position,
          //icon : "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_a.png",
          icon: "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_e.png",

          iconSize: new Tmapv2.Size(24, 38),
          title: name,
          map: map,
        });
        marker_selectedArr.push(marker_selected);
      });
      marker_search_arr.push(marker_search);

      positionBounds.extend(markerPosition); // LatLngBounds의 객체 확장

      map.panToBounds(positionBounds); // 확장된 bounds의 중심으로 이동시키기
      map.zoomOut();
    },
    error: function (request, status, error) {
      console.log(
        "code:" +
          request.status +
          "\n" +
          "message:" +
          request.responseText +
          "\n" +
          "error:" +
          error
      );
    },
  });
});

//------ 경로 안내 ------//
$("#btn_navigate").on("click", navigate);

function navigate() {
  let the_lat, the_lon;
  if (searched) {
    the_lat = selected_position._lat;
    the_lon = selected_position._lng;
  } else {
    the_lat = lat_clicked;
    the_lon = lon_clicked;
  }
  $.ajax({
    method: "POST",
    url: "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result",
    async: false,
    data: {
      appKey: "l7xx2eff6322cd2944cab62446d299f7f6e3",
      startX: lon_current,
      startY: lat_current,
      endX: the_lon,
      endY: the_lat,
      reqCoordType: "WGS84GEO",
      resCoordType: "EPSG3857",
      startName: "출발지",
      endName: "도착지",
    },
    success: (response) => {
      counter++;
      let resultData = response.features;
      //기존 그려진 라인 & 마커가 있다면 초기화
      removeLine();

      //결과 출력
      let tDistance =
        "총 거리 : " +
        (resultData[0].properties.totalDistance / 1000).toFixed(1) +
        "km |";
      let tTime =
        " 총 시간 : " +
        (resultData[0].properties.totalTime / 60).toFixed(0) +
        "분";

      $("#result").text(tDistance + tTime);
      console.log(tDistance, tTime);

      for (let i in resultData) {
        //for문 [S]
        let geometry = resultData[i].geometry;
        let properties = resultData[i].properties;
        let polyline_;

        if (geometry.type == "LineString") {
          for (let j in geometry.coordinates) {
            // 경로들의 결과값(구간)들을 포인트 객체로 변환
            let latlng = new Tmapv2.Point(
              geometry.coordinates[j][0],
              geometry.coordinates[j][1]
            );
            // 포인트 객체를 받아 좌표값으로 변환
            let convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
              latlng
            );
            // 포인트객체의 정보로 좌표값 변환 객체로 저장
            let convertChange = new Tmapv2.LatLng(
              convertPoint._lat,
              convertPoint._lng
            );
            // 배열에 담기
            line_info_arr.push(convertChange);
          }
        } else {
          let markerImg = "";
          let pType = "";
          let size;

          if (properties.pointType === "S") {
            //출발지 마커
            markerImg =
              "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_s.png";
            pType = "S";
            size = new Tmapv2.Size(24, 38);
          } else if (properties.pointType === "E") {
            //도착지 마커
            markerImg =
              "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_e.png";
            pType = "E";
            size = new Tmapv2.Size(24, 38);
          } else {
            //각 포인트 마커
            markerImg = "http://topopen.tmap.co.kr/imgs/point.png";
            pType = "P";
            size = new Tmapv2.Size(8, 8);
          }

          // 경로들의 결과값들을 포인트 객체로 변환
          let latlon = new Tmapv2.Point(
            geometry.coordinates[0],
            geometry.coordinates[1]
          );

          // 포인트 객체를 받아 좌표값으로 다시 변환
          let convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
            latlon
          );

          let routeInfoObj = {
            markerImage: markerImg,
            lng: convertPoint._lng,
            lat: convertPoint._lat,
            pointType: pType,
          };

          // Marker 추가
          marker_points = new Tmapv2.Marker({
            position: new Tmapv2.LatLng(routeInfoObj.lat, routeInfoObj.lng),
            icon: routeInfoObj.markerImage,
            iconSize: size,
            map: map,
          });

          marker_points_arr.push(marker_points);
        }
      } //for문 [E]
      drawLine(line_info_arr);
      console.log(1);
    },
    error: (request, status, error) => {
      console.log(
        "code:" +
          request.status +
          "\n" +
          "message:" +
          request.responseText +
          "\n" +
          "error:" +
          error
      );
    },
  });
}

const drawLine = (arrPoint) => {
  let polyline_;

  polyline_ = new Tmapv2.Polyline({
    path: arrPoint,
    strokeColor: "#DD0000",
    strokeWeight: 6,
    map: map,
  });
  line_result_arr.push(polyline_);
};

const removeMarkers = () => {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  for (let i = 0; i < marker_selectedArr.length; i++) {
    marker_selectedArr[i].setMap(null);
  }
  marker_selectedArr = [];
  markers = [];
};

const removeSearchMarkers = () => {
  for (let i in marker_search_arr) {
    marker_search_arr[i].setMap(null);
  }
  marker_search_arr = [];
};

const removeLine = () => {
  for (let i in line_result_arr) {
    line_result_arr[i].setMap(null);
  }
  line_result_arr = [];

  for (let i in marker_points_arr) {
    marker_points_arr[i].setMap(null);
  }
  marker_points_arr = [];

  line_info_arr = [];

  $("#result").text("");
};

const removeAll = () => {
  removeMarkers();
  removeLine();
  removeSearchMarkers();
};
