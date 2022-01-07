import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';

import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;

  connectedUsers: Map<string, string> = new Map();

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.query.token.toString();
    const payload = this.authService.verifyAccessToken(token);

    const user = payload && (await this.userService.findOne(payload.id));

    if (!user) {
      client.disconnect(true);

      return;
    }

    this.connectedUsers.set(client.id, user.id);
  }

  async handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }
}
