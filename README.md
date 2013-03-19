DDUploader
==========

a html5 file API and websocket based uploading project


How To Use
==========

1. Create a html file. Inport uploader.js. With code like:<br>
\<button class="dd_uploader" wsUrl="ws://localhost:8080/DanmuDemo/fileUpload?uid=user001"\>uploader\</button\><br>
The class must be "dd_uploader", and wsUrl attr can be your WebSocket Server`s url.

2. The FileUploadServer.java and FileUploadInbound.java is the server side code. You can build your own WebSocket Server yourself.
