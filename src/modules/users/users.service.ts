import { Injectable } from '@nestjs/common';

const users = [
    { id: 1, name: 'Ali' },
      { id: 2, name: 'Vali' },
    ]

@Injectable()
export class UsersService {
    
    findAll() {
       return users
    }

    findOne(id : number){
        return users.find(user => user.id == id)
    }
}
