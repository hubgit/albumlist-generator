window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
window.URL = window.URL || window.webkitURL || window.MozURL;

var trackList = $("#trackList");

function addDownloadLink(tracks){
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

var updateTrackList = function(){
	$("#export").remove();
	trackList.empty();

	var text = $("#input").val();

	var items = text.split(/\s*\n+\s*/);
	if (!items.length) return;

	var tracks = [];

	items.forEach(function addTrack(item){
		item = item.replace(/^\d+\.\s+/, "");

		var track = item.split(/\s+[-–—]\s+/);
		if (track.length < 2) return;

		var trackNode = $("<li/>", { "itemscope": "", "itemtype": "http://schema.org/MusicRecording", "class": "haudio" });

		$("<span/>", { "itemprop": "author", "text": track[0], "class": "contributor" }).appendTo(trackNode);
		$("<span> - </span>").appendTo(trackNode);
		$("<span/>", { "itemprop": "name", "text": track[1], "class": "fn" }).appendTo(trackNode);

		trackNode.appendTo(trackList);

		tracks.push(track);
	});

	addDownloadLink(tracks);
}

$("#input").on("keyup", updateTrackList).trigger("keyup");