window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
window.URL = window.URL || window.webkitURL || window.MozURL;

var tracks,
	albums,
	trackList = $("#trackList"),
	albumList = $("#albumList"),
	spotifyTrackList = $("#spotifyTrackList");

var addTrack = function(artist, title, url) {
	var trackContainer = $("<li/>", { "itemscope": "", "itemtype": "http://schema.org/MusicRecording", "class": "haudio" });

	var trackNode = $("<a/>", { href: url, "itemprop": "url" });

	$("<span/>", { "itemprop": "author", "text": artist, "class": "contributor" }).appendTo(trackNode);
	$("<span> - </span>").appendTo(trackNode);
	$("<span/>", { "itemprop": "name", "text": title, "class": "fn" }).appendTo(trackNode);

	trackContainer.append(trackNode).appendTo(trackList);

	spotifyTrackList.val(spotifyTrackList.val() + url + "\n");
};

var addAlbum = function(album) {
	var albumNode = $("<li/>", { "itemscope": "", "itemtype": "http://schema.org/MusicRecording", "class": "haudio" });

	$("<span/>", { "itemprop": "author", "text": album[0], "class": "contributor" }).appendTo(albumNode);
	$("<span> - </span>").appendTo(albumNode);
	$("<span/>", { "itemprop": "name", "text": album[1], "class": "fn" }).appendTo(albumNode);

	albumNode.appendTo(albumList);

	albums.push(album);
};

var splitText = function() {
	var text = $("#input").val(),
		items = [],
		parts = [];

	text.split(/\s*\n+\s*/).forEach(function(item) {
		item = item.replace(/^\d+\.?\s+/, "");
		parts = item.split(/\s+[-–—]\s+/);

		if (parts.length > 1) items.push(parts);
	});

	return items;
};

var findSpotifyAlbum = function(item) {
	var query = 'artist:"' + item[0] + '" album:"' + item[1] + '"';

	var data = localStorage[query];
	if (data) return lookupSpotifyAlbum(JSON.parse(data));

	$.getJSON("http://ws.spotify.com/search/1/album.json", { q: query }, function(data) {
		localStorage[query] = JSON.stringify(data);
		lookupSpotifyAlbum(data);
	});
};

var lookupSpotifyAlbum = function(data) {
	console.log(data);
	try {
		var uri = data.albums[0].href;

		var data = localStorage[uri];
		if (data) return addTracks(JSON.parse(data));

		$.getJSON("http://ws.spotify.com/lookup/1/.json", { uri: uri, extras: "track" }, function(data) {
			localStorage[uri] = JSON.stringify(data.album);
			addTracks(data.album);
		});
	}
	catch (e) {

	}
};

var addTracks = function(album) {
	console.log(album.tracks);
	console.log(album.tracks.length);

	for (var i = 0; i < album.tracks.length; i++) {
		console.log(i);
		var track = album.tracks[i];
		console.log(track);
		addTrack(track.artists[0].name, track.name, track.href);
	}
}

var updateTrackList = function() {
	updateAlbumList();

	tracks = [];

	trackList.empty();
	spotifyTrackList.empty();

	if (!albums.length) return;

	albums.forEach(findSpotifyAlbum);
}

var updateAlbumList = function() {
	albums = [];

	albumList.empty();

	var items = splitText();
	if (!items.length) return;

	items.forEach(addAlbum);
};

$("#input").on("keyup", updateAlbumList).trigger("keyup");
$("#lookup").on("click", updateTrackList);

var addDownloadLink = function(tracks){
	if (!tracks.length) return;

	var xspfNS = "http://xspf.org/ns/0/";

	var doc = document.implementation.createDocument(xspfNS, "playlist", null);
	doc.documentElement.setAttribute("version", "1");

	var trackListNode = doc.createElementNS(xspfNS, "trackList");
	doc.documentElement.appendChild(trackListNode);

	tracks.forEach(function addTrack(track){
		var trackNode = doc.createElementNS(xspfNS, "track");

		var artistNode = doc.createElementNS(xspfNS, "creator");
		artistNode.textContent = track[0];
		trackNode.appendChild(artistNode);

		var titleNode = doc.createElementNS(xspfNS, "title");
		titleNode.textContent = track[1];
		trackNode.appendChild(titleNode);

		trackListNode.appendChild(trackNode);
	});

 	var bb = new BlobBuilder;
	bb.append((new XMLSerializer).serializeToString(doc));
	var blob = bb.getBlob("application/xspf+xml;charset=utf-8");

	var link = $("<a/>", { "id": "export", "text": "Download XSPF", "href": URL.createObjectURL(blob), "download": "playlist.xspf", "class": "btn btn-large btn-primary" });
	$("<div/>").append(link).insertBefore(trackList);
}
