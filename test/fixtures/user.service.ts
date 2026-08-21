import { RequestContext } from "./request-context.js";

class UserRepository {
  findById(id: string) {
    console.log(`[${RequestContext.requestId}] repository lookup for user ${id}`);

    return { id, name: `User ${id}` };
  }
}

export class UserService {
  private readonly repository = new UserRepository();

  getById(id: string) {
    console.log(`[${RequestContext.requestId}] service lookup for user ${id}`);

    return this.repository.findById(id);
  }
}
