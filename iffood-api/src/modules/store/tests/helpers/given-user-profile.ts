import { DataSource } from 'typeorm';
import { UserProfile } from '../../../user-profile/user-profile.entity';

export async function givenUserProfile(dataSource: DataSource) {
  const repo = dataSource.getRepository(UserProfile);

  const user = repo.create({
    name: 'John Doe',
    email: 'johndoe@example.com',
    userAuthId: 'f436715f-7289-4ef6-9173-30449c96cb26',
  });

  return await repo.save(user);
}
