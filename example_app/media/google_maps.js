var latestMap = null;
var messages = [];
function loadMap(
    div_id,
    details_id,
    results_url,
    center_lat,
    center_lng,
    zoom) {
  if (GBrowserIsCompatible()) {
    $(function() {
      $.getJSON(results_url, queryParametersAsLookup(), function(data) {
        if (!data.entries.length) {
          $("#" + div_id).html("Nobody entered any locations yet, but as " +
            "soon as they do we'll put a map here.");
          return;
        }
        var map = initializeMap(div_id, data, center_lat, center_lng, zoom);
        latestMap = map;
        var createClickClosure = function(url) {
          return function() {
            showSubmission(url, div_id, details_id); 
          };
        };
        for (entry_i in data.entries) {
          var entry = data.entries[entry_i];
          var icon = G_DEFAULT_ICON;
          if (entry.icon) {
            icon = new GIcon(G_DEFAULT_ICON, entry.icon);
          }
          messages.push(icon.image);
          var marker = new GMarker(new GLatLng(entry.lat, entry.lng), icon);
          map.addOverlay(marker);
          createClickClosure(marker, entry.url);
          GEvent.addListener(marker, "click", createClickClosure(entry.url));
        }
      });
    });
  } else {
    $("#" + div_id).html("Sorry! Your browser doesn't support Google Maps.");
  }
}

/* Almost identical to parametersFromQuery in main.js, but used by
 * the crowdsourcing sample app, so we need 2 copies. */
function queryParametersAsLookup() {
  query = window.location.search.replace("?", "");
  var hashParts = query.split("&");
  var variables = {};
  for (var i in hashParts) {
    var subParts = hashParts[i].split("=");
    if (subParts.length > 1 && subParts[1].length) {
      variables[unescape(subParts[0])] = unescape(subParts[1]);
    }
  }
  return variables;
}

function showSubmission(url, div_id, details_id) {
  var img = '<img class="loading" src="/media/img/loading.gif" ' +
      'alt="loading" />';
  var details = $("#" + details_id);
  details.html(img);
  var offset = $("#" + div_id).offset;
  details.fadeIn();
  $.get(url, function(results) {
    var get_close = function(class) {
      var div = $("<div />").addClass(class);
      $("<a />").text("Close").click(function(event) {
        event.preventDefault();
        details.hide();
      }).attr("href", "#").appendTo(div);
      return div;
    }
    details.empty();
    details.append(get_close("top_close"));
    $(results).appendTo(details);
    details.append(get_close("bottom_close"));
    initEnlargeable(details);
  });
}

function initializeMap(div_id, data, center_lat, center_lng, zoom) {
  var map = new GMap2(document.getElementById(div_id));
  if (null != center_lat && null != center_lng) {
    var center = new GLatLng(center_lat, center_lng);
  } else {
    var corners = minMaxLatLong(data.entries);
    var center = new GLatLng((corners[0] + corners[2]) / 2,
                             (corners[1] + corners[3]) / 2);
  }
  var use_zoom = 13;
  if (null != zoom) {
    use_zoom = zoom;
  }
  map.setCenter(center, use_zoom);
  map.setUIToDefault();
  if (null == zoom) {
    setZoom(map, data.entries)
  }
  return map;
}

function setZoom(map, entries) {
  var corners = minMaxLatLong(entries);
  var lower = new GLatLng(corners[0], corners[1]);
  var upper = new GLatLng(corners[2], corners[3]);
  bounds = new GLatLngBounds(lower, upper);
  map.setZoom(map.getBoundsZoomLevel(bounds));
}

function minMaxLatLong(entries) {
  var max_lat = max_long = -91.0;
  var min_lat = min_long = 91.0;
  for (entry_i in entries) {
    var entry = entries[entry_i];
    min_lat = entry.lat < min_lat ? entry.lat : min_lat;
    min_long = entry.lng < min_long ? entry.lng : min_long;
    max_lat = entry.lat > max_lat ? entry.lat : max_lat;
    max_long = entry.lng > max_long ? entry.lng : max_long;
  }
  return [min_lat, min_long, max_lat, max_long];
}