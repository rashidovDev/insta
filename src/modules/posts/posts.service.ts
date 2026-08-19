import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PostsService {
    constructor(@InjectRepository(Post)
    private readonly postsRepository : Repository<Post>
    ){}

    async createPost(title:string, content:string,  userId: number){
        const post = this.postsRepository.create({
            title,
            content,
            user: { id: userId },
        });
        return await this.postsRepository.save(post)
    }

}
