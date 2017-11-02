var users = null;
var spreadsheet_id = "1hWZB7zOibHm7jClTZ0HyWP8XTQIYlfVKunEMQLICF60";
var getUsers = function(cb){
 if(users != null){
 	 cb(users);
   return true;
 } cellsAPI(spreadsheet_id,function(lines){
    users = {};
    for(var i = 1; i < lines.length;++i){
        users[lines[i][1]] =  lines[i][2];
    }
    cb(users);
  });
}



var cellsAPI = function(sid,callback){
 $.get("https://spreadsheets.google.com/feeds/cells/"+sid+"/od6/public/values?alt=json",function(json){
    console.log(json);
    var entries = json.feed.entry;
    var lines = entries.reduce(function(now,cell){
      var row = parseInt(cell.gs$cell.row,10);
      var col = parseInt(cell.gs$cell.col,10);

      now[row] = now[row] || [];
      now[row][col] = cell.gs$cell.$t;
      return now;
    },[]);
    callback(lines);
    });
    
};

var getAndProcessData = function(sid,callback){


cellsAPI(sid,function(lines){
   var important_notes = [];
   lines.filter(function(line){
      return line[1] == "時力本周重點回顧";
   })[0].slice(2).forEach(function(t){ 
      important_notes.push(t);
   });
  
    var week = lines.filter(function(line){
      return line[1] == "電子報週";
    })[0][2];

		var video_onsite = lines.filter(function(line){
      return line[1] == "本週影片網址";
    })[0][2];
   
		var video_youtube = lines.filter(function(line){
      return line[1] == "本週影片youtube";
    })[0][2];   
    
    var video_preview = lines.filter(function(line){
    	return line[1] == "本週影片預覽縮圖";
    })[0][2];
    
    var find = false;
    var raw_news = lines.filter(function(item,ind){
      if(item[1]=="新聞分類"){
        find = true;
        return false;      
      }
      return find && $.trim(item[1]) != "";
    });

    var news = raw_news.map(function(item){
      var cateogry = item[1];
      var img = item[2];
      var title = item[3];
      var desc = item[4];
      var links = [];
      for(var i = 5; i< item.length;i+=2){
        if(item[i]){
          links.push({text:item[i],link:item[i+1]});
        }
      }
      return {category:cateogry,img:img,title:title,desc:desc,links:links};
    });

    var data = {
      important_notes:important_notes,
      week:week,
      news:news,
      video_onsite:video_onsite,
      video_youtube:video_youtube,
      video_preview:video_preview
    };


    var categoryMap = {},categories = [];

    news.forEach(function(n){
      if(categoryMap[n.category] == null){
        categoryMap[n.category] = [];
        categories.push(n.category);
      }
      categoryMap[n.category].push(n);
    });

    data.categoryMap = categoryMap;
    data.categories = categories;

    //console.log(important_notes,week)
    callback(data);

  });

};

var processHtmlTemplate = function(){
	
};

$("#go").click(function(){
	
  var link = $("#spreadsheet").val()
  
  var start= link.indexOf("/d/");
  var end = link.indexOf("/",start+4);
  
  var sid = link.substring(start+3,end);
	
  getUsers(function(users){
  
  
  getAndProcessData(sid,function(data){
		var html = $("#emailTemp").val();
    var videoHTML = '<div class="title" style="font-family:Helvetica, Arial, sans-serif;font-size:18px;color:#374550"> <video width="100%" height="auto" poster="'+data.video_preview+'" controls="controls"> <source src="'+data.video_onsite+'" type="video/mp4" /> <!-- 這邊加上官網影片連結 --> <!-- 部分裝置無法直接撥影片則使用放使用圖片連結 --> <a href="'+data.video_youtube+'"> <!-- 這邊加上Youtube連結 --> <!-- 顯示圖片 --> <img src="'+data.video_preview+'" width="100%" height="360" /> <!-- 這邊加上要顯示的封面圖片 --> </a> </video> <!-- 文字連結 --> <a class="link-mobile" style="display:block;font-size: 14px;color: #eee;text-align: center;text-decoration: none;line-height: 3em;height: 3em;background-color: #f39c12;" href="'+data.video_youtube+'">注意：行動裝置無法觀看影片請按此觀賞。</a> <!-- 這邊加上Youtube連結 --> </div>';

		var WEEK_IMPORTANT = ['<ul style="line-height: 1.4em;margin:0;">'];
    data.important_notes.forEach(function(note){
    	WEEK_IMPORTANT.push("<li>"+note+"</li>");
    });
    WEEK_IMPORTANT.push("</ul>");
    
    var WEEK_LIST = [];
   	data.categoryMap["時力一週"].forEach(function(n){
    	WEEK_LIST.push('<div style="width:100%;height:auto;padding: 10px 0;overflow: hidden;min-height: 110px;"> <div style="width:20%;height: 100%;float: left;margin-right: 1em;"> <img style="height: auto;width:100%;border-radius: 50%;" src="'+(users[n.img] || users["黨團"])+'" alt=""> </div> <h4 style="margin: 5px 0;">'+n.title+'</h4> <p style="margin:0;width: 76%;margin-left: 24%">'+(n.desc||"")+'</p>');
      n.links.forEach(function(link){
      	WEEK_LIST.push('<a style="color: #2980B9;width: 76%;margin-left: 24%;display: block;line-height: 1.6em;text-decoration: none;" href="'+link.link+'">'+link.text+'</a>');
      });
      WEEK_LIST.push("</div>");
    });
    
    var CATEGORIES = [];
    data.categories.forEach(function(c){
    	if(c == "時力一週"){
				return true;
      }
			CATEGORIES.push('    <h3 style="color: #EA5959;border-left: 5px solid #EA5959;background-color: rgba(249, 139, 96, 0.17);padding: 0.5em 0;padding-left:0.5em;">'+c+'</h3>');
      if(data.categoryMap[c] == null){
      	debugger;
      }
      data.categoryMap[c].forEach(function(n){
        CATEGORIES.push('<div style="width:100%;height:auto;padding: 10px 0;overflow: hidden;min-height: 110px;"> <div style="width:20%;height: 100%;float: left;margin-right: 1em;"> <img style="height: auto;width:100%;border-radius: 50%;" src="'+(users[n.img] || users["黨團"])+'" alt=""> </div> <h4 style="margin: 5px 0;">'+n.title+'</h4> <p style="margin:0;width: 76%;margin-left: 24%">'+(n.desc||"")+'</p>');
        n.links.forEach(function(link){
          CATEGORIES.push('<a style="color: #2980B9;width: 76%;margin-left: 24%;display: block;line-height: 1.6em;text-decoration: none;" href="'+link.link+'">'+link.text+'</a>');
        });
        CATEGORIES.push("</div>");
      });
    });
    

    
    var resultHTML = html.replace("%%%VIDEO%%%",videoHTML).replace("%%%WEEK_IMPORTANT%%%",WEEK_IMPORTANT.join("")).replace("%%%WEEK_LIST%%%",WEEK_LIST.join("")).replace("%%%CATEGORIES%%%",CATEGORIES.join(""));

    $("#emailOutput").val(resultHTML);
    
  });
  
  });
});
