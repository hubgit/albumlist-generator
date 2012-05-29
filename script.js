window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
window.URL = window.URL || window.webkitURL || window.MozURL;

var albumList = $("#albumList"),
	spotifyList = $("#spotifyList");

var addAlbum = function(album) {
	var albumContainer = $("<li/>", { "itemscope": "", "itemtype": "http://schema.org/MusicRecording", "class": "haudio" });

	var albumNode = $("<a/>", { "itemprop": "url" });

	$("<span/>", { "itemprop": "author", "text": album[0], "class": "contributor" }).appendTo(albumNode);
	$("<span> - </span>").appendTo(albumNode);
	$("<span/>", { "itemprop": "name", "text": album[1], "class": "fn" }).appendTo(albumNode);

	albumContainer.append(albumNode).appendTo(albumList);
};

var linkAlbum = function(albumNode, artist, title, url) {
	albumNode.find("[itemProp='url']").attr("href", url);
	spotifyList.val(spotifyList.val() + url + "\n");
}

var parseSpotifyAlbum = function(albumNode, album) {
	linkAlbum(albumNode, album.artists[0].name, album.name, album.href);
};

var findSpotifyAlbum = function(albumNode, artist, title) {
	var query = 'artist:"' + artist + '" album:"' + title + '"';

	var data = localStorage[query];
	if (typeof data != "undefined") return parseSpotifyAlbum(albumNode, JSON.parse(data));

	$.getJSON("http://ws.spotify.com/search/1/album.json", { q: query }, function(data) {
		if (!data.albums[0]) {
			albumNode.addClass("error");
			return;
		}
		localStorage[query] = JSON.stringify(data.albums[0]);
		parseSpotifyAlbum(albumNode, data.albums[0]);
	});
};

var findSpotifyAlbums = function() {
	spotifyList.val("");
	
	albumList.find("[itemType='http://schema.org/MusicRecording']").each(function(index, item) {
		var albumNode = $(item);
		var artist = albumNode.find("[itemProp='author']").text();
		var title = albumNode.find("[itemProp='name']").text();
		findSpotifyAlbum(albumNode, artist, title);
	});
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

var updateAlbumList = function() {
	albumList.empty();
	spotifyList.val("");

	var items = splitText();
	if (!items.length) return;

	items.forEach(addAlbum);
};

$("#input").on("keyup", updateAlbumList).trigger("keyup");
$("#lookup").on("click", findSpotifyAlbums);

/*
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
*/
