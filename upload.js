
/**
 * 文件信息类
 * @param id 待上传文件id
 * @param file 待上传文件对象
 * @param pagesize 分页大小，将大文件分页传输，防止撑爆内存
 * @returns {FileUpload}
 */
function FileInfo(id, file, pagesize) {
    this.size = file.size;
    this.file = file;
    this.FileType = file.type;
    this.fileName = file.name;
    this.pageSize = pagesize;
    this.pageIndex = 0;
    this.pages = 0;
    this.UploadError = null;
    this.dataBuffer = null;//保存读到内存中的文件片段
    this.uploadBytes = 0;
    this.id = id;
    if (Math.floor(this.size % this.pageSize) > 0) {
        this.pages = Math.floor((this.size / this.pageSize)) + 1;

    }
    else {
        this.pages = Math.floor(this.size / this.pageSize);

    }
}


/**
 * The DDUploader object
 * @constructor
 * @param {DOMElement} uploadBtn The upload Button node
 * @param {String} wsUrl The websocket url
 */
function DDUploader(uploadBtn, wsUrl){
  
	this.uploadBtn = uploadBtn;
	this.wsUrl = wsUrl;//建立websocket的地址
	this.ready = false;//是否初始化完成
	this.ws = null;//websocket对象
	this.fileReader = null;
	this.uploading = false;//标记是否有文件正在上传
	this.uploaded = 0;//本次链接已上传文件数
	
	if(typeof DDUploader.initialized == "undefined"){
		
		DDUploader.prototype.init = function(){
			if(this.ready) return;//如果初始化过，直接返回
			
			//创建上传的div
			var wrapper = document.createElement('div');
			var template = 
				'<div id="dd_uploader_wrapper" class="">'+
					'<div id="dd_uploader_drap_drop_area" class="">drap and drop your file<button id="dd_uploader_close">X</button></div>'+
					'<div id="dd_uploader_file_list" class=""></div>'+
				'</div>';
			wrapper.innerHTML = template;
			this.uploadBtn.parentNode.insertBefore(wrapper, this.uploadBtn);
			
			//初始化事件监听器
			this.initEventListeners();
			
	    	//建立websocket连接
			if ('WebSocket' in window)  
		        this.ws = new WebSocket(this.wsUrl);  
		    else if ('MozWebSocket' in window)  
		    	this.ws = new MozWebSocket(this.wsUrl);  
		    else  
		        return;
			
			var that = this;
			//初始化websocket中的方法
			if(this.ws != null){
				//当连接打开后的事件
				this.ws.onopen = function(evt) {
					console.log("Openened connection to websocket");
					
					//注册关闭按钮，当关掉的时候发送close【再连接打开后再注册该方法，否则连接没打开就发送close会报错】
					document.getElementById('dd_uploader_close').addEventListener('click', function(){that.fileReader.abort();that.ws.send("close"); }, false);
				};
				this.ws.onclose = function(evt) {
					console.log("Closed connection to websocket");
					//释放资源
					this.ws = null;
					this.fileReader = null;
					this.uploading = false;
					wrapper.parentNode.removeChild(wrapper);
				};
			}
			
			this.ready = true;//标记初始化完成
		};
		
		/**
		 * Inits most the the event listeners
		 */		
		DDUploader.prototype.initEventListeners = function(){
			var that = this;
			//注册drag和drop的事件监听器
			document.getElementById('dd_uploader_drap_drop_area').addEventListener('dragover', that.handleDragOver, false);
			document.getElementById('dd_uploader_drap_drop_area').addEventListener('dragenter', that.handleDragEnter, false);
			document.getElementById('dd_uploader_drap_drop_area').addEventListener('dragleave', that.handleDragLeave, false);
	  		document.getElementById('dd_uploader_drap_drop_area').addEventListener('drop',function(evt){that.handleDrop(evt); }, false);
		};
		
		DDUploader.prototype.handleDragOver = function(evt){
			evt.stopPropagation();
			evt.preventDefault();
			evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
		};
		DDUploader.prototype.handleDragEnter = function(evt){
			evt.stopPropagation();
			evt.preventDefault();
			//TODO 改变dd_uploader_drap_drop_area的样式
		};
		DDUploader.prototype.handleDragLeave = function(evt){
			evt.stopPropagation();
			evt.preventDefault();	
			//TODO 还原dd_uploader_drap_drop_area的样式
		};
		DDUploader.prototype.handleDrop = function(evt){
			if(this.uploading) return;
			
			evt.stopPropagation();
		    evt.preventDefault();
		    //TODO 还原dd_uploader_drap_drop_area的样式
		    
		    var files = evt.dataTransfer.files; // FileList object.
		    if (files.length > 0) {
		    	//一次只能拖一个文件上传，不支持多文件同时上传
//                for (var i = 0; i < files.length; i++) {
                    var info = new FileInfo(this.uploaded, files[0], 10000);
                    this.addUploadItem(info);
//                }
            }
		};
		
		/**
		 * 添加待上传文件信息
		 * @param info
		 */
		DDUploader.prototype.addUploadItem = function(info) {
			var list = document.getElementById('dd_uploader_file_list');
			var item = '<div id="file_'+info.id+'">'+info.fileName+'<div id="progress_'+info.id+'">0%</div></div>';
			list.innerHTML += item;
			this.uploading = true;
			this.upload(info);//启动上传
        };
		
		/**
		 * 上传文件
		 * @param ws websocket对象
		 */
		DDUploader.prototype.upload = function (info) {
			var that = this;
			//上传文件信息
			this.ws.send("fileName="+info.fileName+"&size="+info.size);
			//如果文件信息上传成功，则开始上传数据
			this.ws.onmessage = function(msg) {
				if(msg.data == "ok"){
					that.onLoadData(info);
				}
			};
		};
		
		/**
		 * 上传文件数据
		 * @param info
		 */
		DDUploader.prototype.onLoadData = function(info) {
			if (this.fileReader == null)
				this.fileReader = new FileReader();
			
			var reader = this.fileReader;
			reader["tag"] = info;// 暂存info对象
			reader["this"] = this;// 暂存this对象
			reader.onloadend = this.onLoadDataCallBack;
			var count = info.size - info.pageIndex * info.pageSize;
			if (count > info.pageSize)
				count = info.pageSize;
			info.uploadBytes += count;
			var blob = info.file.slice(info.pageIndex * info.pageSize, info.pageIndex * info.pageSize + count);

			reader.readAsArrayBuffer(blob);
		};
		/**
		 * 上传文件数据的回调函数
		 * @param evt
		 */
		DDUploader.prototype.onLoadDataCallBack = function(evt) {
			var obj = evt.target["tag"];//拿到暂存的info对象
			var that = evt.target["this"];//拿到暂存的this对象
			if (evt.target.readyState == FileReader.DONE) {
				obj.dataBuffer = evt.target.result;
				that.ws.send(obj.dataBuffer);
				//
				that.ws.onmessage = function(msg) {
					console.log(msg.data);
					obj.pageIndex++;
					evt.target["tag"] = obj;//更新暂存的info对象
					that.updateProgress(obj);
					if (obj.pageIndex < obj.pages) {
						that.onLoadData(obj);
					}else{
						that.uploaded++;
						that.ws.send("fin");
						that.uploading = false;
					}
				};
			}
		};
		
		/**
		 * 更新文件上传进度
		 * @param file
		 */
		DDUploader.prototype.updateProgress = function(file) {
			var percentLoaded = parseInt((file.pageIndex / file.pages) * 100);
			var progress = document.getElementById('progress_' + file.id);
			if (0 < percentLoaded < 100) {
				progress.style.width = percentLoaded + '%';
				progress.textContent = percentLoaded + '%';
			}
		};
		
		/**
		 * Setup the DDUploader
		 */
		DDUploader.prototype.setup = function(){
			var that = this;
			this.uploadBtn.addEventListener('click', function(){ that.init(); }, false);
		};
		
		DDUploader.initialized = true;
	}
	
	/**
	 * Init the DDUploader
	 */
	this.setup();
};

window.addEventListener('DOMContentLoaded',function(){
	
	var dd_uploader = document.querySelector('button.dd_uploader');
	var wsUrl = dd_uploader.getAttribute('wsUrl');//从前台页面获得
	new DDUploader(dd_uploader, wsUrl);
	
}, false);
