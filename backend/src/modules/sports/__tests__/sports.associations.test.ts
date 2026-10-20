import sequelize from '@config/database';
import SportsEnrollment, { initSportsEnrollment } from '@models/SportsEnrollment.model';
import Sport, { initSport } from '@models/Sport.model';
import Team, { initTeam } from '@models/Team.model';
import { setupSportsAssociations } from '@models/associations';

describe('Sports enrollment associations', () => {
  beforeAll(() => {
    initSport(sequelize);
    initTeam(sequelize);
    initSportsEnrollment(sequelize);
    setupSportsAssociations();
  });

  it('registers the team association used by student participation summaries', () => {
    const teamAssociation = SportsEnrollment.associations.team;

    expect(teamAssociation).toBeDefined();
    expect(teamAssociation.target).toBe(Team);
    expect(teamAssociation.foreignKey).toBe('teamId');
    expect(Sport.associations.enrollments.target).toBe(SportsEnrollment);
  });
});
