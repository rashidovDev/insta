import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';


@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) 
    private readonly usersRepository : Repository<User>,
){}

async create(name : string, email : string) {
  const user = this.usersRepository.create({
  name,
  email
});
  return await this.usersRepository.save(user);
} 

async findAll() {
  return this.usersRepository.find();
}

 async findOne(id: number) {
  return this.usersRepository.findOne({
    where: { id },
    relations: {
      posts : true
    }
  });
}
}
