package dd.tv.servlet.websocket;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;

import common.utils.StringUtils;

@WebServlet("/fileUpload")
/**
 * 基于Tomcat容器的WebSocket服务器端，用于实现文件上传
 * @author dd
 *
 */
public class FileUploadServer extends WebSocketServlet{

  private static final long serialVersionUID = 1L;

	@Override
	/**为每个接入用户创建处理类*/
	protected StreamInbound createWebSocketInbound(String subProtocol,
			HttpServletRequest request) {
		String userId = request.getParameter("uid");
		System.out.println("uid: "+userId+" in!");
		if(!StringUtils.isEmpty(userId)){
			return new FileUploadInbound();
		}else{
			return null;
		}
	}

}
