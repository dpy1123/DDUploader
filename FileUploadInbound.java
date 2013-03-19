package dd.tv.servlet.websocket;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;

import org.apache.catalina.websocket.Constants;
import org.apache.catalina.websocket.MessageInbound;

/**
 * 处理具体的接入连接
 * @author dd
 *
 */
public class FileUploadInbound extends MessageInbound{

  RandomAccessFile file = null;
	
	public FileUploadInbound() {
		super();
	}
	
	
	@Override
	protected void onBinaryMessage(ByteBuffer buf) throws IOException {
		// TODO Auto-generated method stub
		System.out.println("onBinaryMessage");
		if(file == null) return;
		
		System.out.println("limit: "+buf.limit());
		file.write(buf.array(), 0, buf.limit());
		
		CharBuffer outBuffer = CharBuffer.wrap("ok");
		this.getWsOutbound().writeTextMessage(outBuffer);
	}

	@Override
	protected void onTextMessage(CharBuffer message) throws IOException {
		String msg = message.toString();
		if (msg.equals("fin")) {
			this.file.close();

		} else if (msg.equals("close")) {
			this.getWsOutbound().close(Constants.STATUS_CLOSE_NORMAL, null);

		} else if (msg.startsWith("fileName")) {
			String fileName = msg.substring(msg.indexOf("fileName=")+"fileName=".length(), msg.indexOf("&"));
			System.out.println(fileName);
			file = new RandomAccessFile(fileName, "rws");

			try {
				CharBuffer buffer = CharBuffer.wrap("ok");
				this.getWsOutbound().writeTextMessage(buffer);
			} catch (IOException ignore) {
				ignore.printStackTrace();
			}
		}
		
	}


}
