// Author: Simon J. Hogan
// Modifed: 24/04/2016
// Sith'ari Consulting Australia
// --------------------------------------------

function Home() {
	this.backdrops;
	this.total = 0;
	this.count = 0;
};

Home.prototype.load = function() {
	var self = this;

	this.backdrops = new Array();
	this.total = 0;
	this.count = 0;

	dom.show("#server");
	dom.show("#user");
	dom.hide("#homeLink");
					
	dom.html("#view", {
		nodeName: "div",
		className: "home-view",
		id: "home",
		childNodes: [{
			nodeName: "div",
			className: "user-views",
			id: "userViews",
				childNodes: [{
				nodeName: "div",
				className: "user-views-column",
				id: "userViews_0"
			}]
		}]
	});

	dom.on("body", "keydown", lostFocus);
			
	dom.delegate("#home", "a.latest-item", "click", function(event) {
		dom.dispatchCustonEvent(document, "mediaItemSelected", event.delegateTarget.dataset);
	});	

	dom.delegate("#home", "a.latest-items-more", "click", function(event) {
		dom.dispatchCustonEvent(document, "userViewMoreSelected", event.delegateTarget.dataset);
	});	

	dom.delegate("#home", "a", "keydown", navigation);
					
	emby.getUserItems({
		limit: 2,
		mediaTypes: 'video',
		recursive: true,
		sortBy: 'dateplayed',
		sortOrder: 'descending',
		filters: 'isresumable',
		success: displayUserResumeItems,
		error: error				
	});
						
	emby.getUserViews({
		success: displayUserViews,
		error: error			
	});	
		
	function displayUserViews(data) {
		var limit = 5;
		var rowCount = 6;
		var columnCount = 1;		
		var currentColumn = 0;
		
		data.Items = data.Items.filter(function(item) {
			return item.CollectionType == "movies" ||
				item.CollectionType == "photos" ||
				item.CollectionType == "music" ||
				(item.CollectionType == "tvshows") ||
				(item.CollectionType == null)
		});
		
		self.total += data.Items.length;
		columnCount =  Math.ceil(data.Items.length / rowCount);
			
		var idx = 0;
		data.Items.forEach(function(item, index) {
			var column = Math.floor(index/rowCount);
			var row = index - (column*rowCount);
			idx++;

			switch (item.CollectionType) {
				case "music", "photos":
					limit = 3;
					break;
				default:
					limit = 5;
					break;				
			}

			if (column > currentColumn) {
				currentColumn = column;
				dom.append("#userViews", {
					nodeName: "div",
					className: "user-views-column",
					id: "userViews_" + currentColumn
				});
			}
			
			dom.append("#userViews_" + currentColumn, {
				nodeName: "a",
				href: "#",
				className: "user-views-item user-views-item-" + item.CollectionType,
				id: "viewItem_" + currentColumn + "_" + row,
				dataset: {
					id: item.Id,
					collectionType: item.CollectionType,
					name: item.Name,
					limit: limit,	
					imageTag: item.ImageTags.Primary,				
					keyUp: row == 0 ? ".server-link" : "#viewItem_" + currentColumn + "_" + (row - 1),
					keyRight: currentColumn ==  columnCount ? "#latestItemSet_0 a" : "#viewItem_" + (currentColumn + 1) + "_" + row + ", #latestItemSet_0 a",
					keyDown: row == rowCount - 1 ? "#viewItem_" + currentColumn + "_" + row : "#viewItem_" + currentColumn + "_" + (row + 1),
					keyLeft: currentColumn == 0 ? "#viewItem_" + currentColumn + "_" + row : "#viewItem_" + (currentColumn - 1) + "_" + row					
				},
				childNodes: [{
					nodeName: "span",
					className: "user-views-item-name",	
					text: item.Name		
					//text: item.CollectionType			
				}]
			});		
						
			emby.getUserLastestItems({
				includeItemTypes: "",
				enableImageTypes: "primary,thumb,backdrop",
				limit: limit,
				parentId: item.Id,
				parentName: item.Name,
				parent: item,
				success: displayUserLatestItems,
				error: error				
			});				
		});

// Settings logic
		limit = 5;
		rowCount = 6;
		columnCount = 1;		
		currentColumn = 0;
		var column = Math.floor(idx/rowCount);
		var row = idx - (column*rowCount);
			currentColumn = column;
			dom.append("#userViews", {
				nodeName: "div",
				className: "user-views-column",
				id: "userViews_" + currentColumn
			});
			
		dom.append("#userViews_" + currentColumn, {
			nodeName: "a",
			href: "#",
			className: "user-views-item user-views-item-settings",
			id: "viewItem_" + currentColumn + "_" + row,
			dataset: {
				id: "viewItem_settings",
				collectionType: "settings",
				name: "Emby Settings",
				limit: limit,	
				keyUp: row == 0 ? ".server-link" : "#viewItem_" + currentColumn + "_" + (row - 1),
				keyRight: currentColumn ==  columnCount ? "#latestItemSet_0 a" : "#viewItem_" + (currentColumn + 1) + "_" + row + ", #latestItemSet_0 a",
				keyDown: row == rowCount - 1 ? "#viewItem_" + currentColumn + "_" + row : "#viewItem_" + currentColumn + "_" + (row + 1),
				keyLeft: currentColumn == 0 ? "#viewItem_" + currentColumn + "_" + row : "#viewItem_" + (currentColumn - 1) + "_" + row					
			},
			childNodes: [{
				nodeName: "span",
				className: "user-views-item-name",	
				text: "Settings"				
				//text: item.CollectionType			
			}]
		});		
		
// End Settings Logic	
		dom.on(".user-views-item", "click", function(event) {
			dom.dispatchCustonEvent(document, "userViewSelected", this.dataset);
		});		
	}

	function displayUserResumeItems(data) {
		renderer.userResumeItems(data, {
			container: "#home",
			heading: "Continue Watching",
			headerLink: "#server a"
		});
	}
		
	function displayUserLatestItems(data) {	 
		if (data.Items.length > 0) {					
			data.Items.forEach(function(item, index) {						
				if (item.BackdropImageTags[0]) {
					self.backdrops.push(item.Id + ":" + item.BackdropImageTags[0]);
				}	
			});
	
			if (self.backdrops.length > 0) {
				var index = Math.floor((Math.random() * self.backdrops.length))
				var backdrop = self.backdrops[index].split(":");
				
				dom.css("#poster", {
					backgroundImage: "url(" + emby.getImageUrl({'itemId': backdrop[0], tag: backdrop[1], imageType: 'Backdrop', height: 1080}) + ")"
				});
			}
			
			renderer.userSummaryItems(data, {
				container: "#home",
				id: guid.create(),				
				heading: "Recently Added " + data.parent.Name,
				headerLink: "#server a"
			});
		}	

		complete();			
	}

	function complete() {
		self.count++;
		
		if (self.count == self.total) {
			var nodes = dom.querySelectorAll(".latest-items");
			for (var i = 0; i < nodes.length; i++) {
				nodes[i].id = "latestItemSet_" + i;
			}
			dom.dispatchCustonEvent(document, "allHomeItemsLoaded");
			
			focus(".user-views-item");		
		}		
	}

	function lostFocus(event) {
		if (event.target.tagName != "A") {
			focus(dom.data("#view", "lastFocus"));
		}
	}

	function navigation(event) {
		event.preventDefault();
		event.stopPropagation();
		var self = event.delegateTarget;

		if (event.which == keys.KEY_OK) {
			self.click();
			return;
		}
					
		if (dom.hasClass(self, "user-views-item")) {	
			switch (event.which) {
				case keys.KEY_LEFT: 
					focus(dom.data(self, "keyLeft"));
					break;
				case keys.KEY_UP: 
					focus(dom.data(self, "keyUp"));
					break;
				case keys.KEY_RIGHT: 
					focus(dom.data(self, "keyRight"));
					break;
				case keys.KEY_DOWN: 
					focus(dom.data(self, "keyDown"));
					break;											
			}
		}
		
		if (dom.hasClass(self, "latest-item")) {	
			var columnSetIndex = self.parentNode.parentNode.id ? parseInt(self.parentNode.parentNode.id.substr(self.parentNode.parentNode.id.lastIndexOf("_") + 1)) : 0;
			var lastColumn = columnSetIndex > 0 ? dom.data("#latestItemSet_" + (columnSetIndex - 1), "lastColumn") : "";
			
			switch (event.which) {
				case keys.KEY_LEFT: 
					focus(dom.data(self, "keyLeft").replace("%previous%", columnSetIndex > 0 ? "#latestItemSet_" + (columnSetIndex - 1) +  " .latest-items-column-" + lastColumn + " a" : ".user-views .user-views-column:last-child a"));
					break;
				case keys.KEY_UP: 
					focus(dom.data(self, "keyUp"));
					break;
				case keys.KEY_RIGHT: 
					focus(dom.data(self, "keyRight").replace("%next%", "#latestItemSet_" + (columnSetIndex + 1) +  " .latest-items-column a"));
					break;
				case keys.KEY_DOWN: 
					focus(dom.data(self, "keyDown"));
					break;																	
			}
		}	
		
		if (dom.hasClass(self, "latest-items-more")) {
			focus(dom.data("#view", "lastFocus"));
		}	
	}

	function focus(query) {
		var node = dom.focus(query);
		if (node && node.id) {
			if (node.id.indexOf("_more") == -1) {
				dom.data("#view", "lastFocus", "#" + node.id);
			}
			if (dom.hasClass(node, "latest-item")) {
				var year = dom.data(node, "year") || "";
				var runtime = Number(dom.data(node, "runtime")) || 0;
				var hours = (runtime >= 60 ? Math.floor(runtime/60) + " hr " : "");
				var mins = (runtime % 60 > 0 ? runtime % 60 + " min" : "");
	
				dom.html("#details", {
					nodeName: "div",
					childNodes: [{
						nodeName: "div",
						className: "title",
						text: dom.data(node, "name")
					}, {
						nodeName: "div",
						className: "subtitle",
						text: year + (runtime ? " / " + hours + mins : "")						
					}]
				})
			} else {
				dom.empty("#details");
			}
		}
	}
			
	function error(data) {
		complete();
		message.show({
			messageType: message.error,			
			text: "Loading user views failed!"
		});			
	}	
};