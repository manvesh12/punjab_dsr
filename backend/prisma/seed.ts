import { PrismaClient, Role, ProjectStatus, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function clearData() {
  console.log("Clearing existing data...");
  // Use raw queries or deleteMany to clear data
  await prisma.notification.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.workflowHistory.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.replenishmentStudy.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.district.deleteMany({});
  await prisma.state.deleteMany({});
  console.log("Existing data cleared.");
}

async function seedData() {
  console.log("Seeding State and Districts...");
  const state = await prisma.state.create({
    data: {
      name: "Punjab",
      code: "PB",
    }
  });

  const ludhiana = await prisma.district.create({
    data: { name: "Ludhiana", code: "LDH", stateId: state.id }
  });
  
  const amritsar = await prisma.district.create({
    data: { name: "Amritsar", code: "AMR", stateId: state.id }
  });

  const mohali = await prisma.district.create({
    data: { name: "SAS Nagar (Mohali)", code: "MHL", stateId: state.id }
  });

  const defaultPassword = await bcrypt.hash("Gov@2026!Secure", 10);

  console.log("Seeding Users...");
  
  const usersToCreate = [
    { fullName: "Paramjit Singh", username: "super.admin", email: "paramjit.singh@punjab.gov.in", password: defaultPassword, role: Role.SUPER_ADMIN, employeeId: "PB-ADM-0001", stateId: state.id },
    { fullName: "Manpreet Kaur", username: "state.admin", email: "manpreet.kaur@punjab.gov.in", password: defaultPassword, role: Role.STATE_ADMIN, employeeId: "PB-ADM-0002", stateId: state.id },
  ];

  const districtConfigs = [
    { district: ludhiana, prefix: "LDH", idStart: 1000 },
    { district: amritsar, prefix: "AMR", idStart: 2000 },
    { district: mohali, prefix: "MHL", idStart: 3000 }
  ];

  for (const dc of districtConfigs) {
    let idCounter = dc.idStart;
    
    // 1 District Admin
    usersToCreate.push({ fullName: `District Admin ${dc.prefix}`, username: `admin.${dc.prefix.toLowerCase()}`, email: `admin.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.DISTRICT_ADMIN, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `DC Office ${dc.district.name}`, designation: "District Commissioner" });
    
    // 2 District Officers
    usersToCreate.push({ fullName: `Officer One ${dc.prefix}`, username: `officer1.${dc.prefix.toLowerCase()}`, email: `officer1.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.DISTRICT_OFFICER, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `Mining Office ${dc.district.name}`, designation: "District Mining Officer" });
    usersToCreate.push({ fullName: `Officer Two ${dc.prefix}`, username: `officer2.${dc.prefix.toLowerCase()}`, email: `officer2.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.DISTRICT_OFFICER, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `Mining Office ${dc.district.name}`, designation: "District Mining Officer" });

    // 1 Geologist
    usersToCreate.push({ fullName: `Geologist ${dc.prefix}`, username: `geologist.${dc.prefix.toLowerCase()}`, email: `geo.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.GEOLOGIST, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `Geology Dept ${dc.district.name}`, designation: "Senior Geologist" });

    // 1 Survey Officer
    usersToCreate.push({ fullName: `Surveyor ${dc.prefix}`, username: `surveyor.${dc.prefix.toLowerCase()}`, email: `survey.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.SURVEY_OFFICER, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `Survey Dept ${dc.district.name}`, designation: "Survey Officer" });

    // 1 Reviewer
    usersToCreate.push({ fullName: `Reviewer ${dc.prefix}`, username: `reviewer.${dc.prefix.toLowerCase()}`, email: `review.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.REVIEWER, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `Review Board ${dc.district.name}`, designation: "Technical Reviewer" });

    // 2 Data Entry Operators
    usersToCreate.push({ fullName: `DEO One ${dc.prefix}`, username: `deo1.${dc.prefix.toLowerCase()}`, email: `deo1.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.DATA_ENTRY_OPERATOR, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `Mining Office ${dc.district.name}`, designation: "Data Entry Operator" });
    usersToCreate.push({ fullName: `DEO Two ${dc.prefix}`, username: `deo2.${dc.prefix.toLowerCase()}`, email: `deo2.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.DATA_ENTRY_OPERATOR, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `Mining Office ${dc.district.name}`, designation: "Data Entry Operator" });

    // 1 Report Generator
    usersToCreate.push({ fullName: `Report Gen ${dc.prefix}`, username: `reportgen.${dc.prefix.toLowerCase()}`, email: `report.${dc.prefix.toLowerCase()}@punjab.gov.in`, password: defaultPassword, role: Role.REPORT_GENERATOR, employeeId: `PB-${dc.prefix}-${++idCounter}`, stateId: state.id, districtId: dc.district.id, officeName: `IT Dept ${dc.district.name}`, designation: "Report Specialist" });
  }

  const createdUsers = [];
  for (const u of usersToCreate) {
    const created = await prisma.user.create({ data: u });
    createdUsers.push(created);
  }

  console.log("Seeding Projects...");
  for (const dc of districtConfigs) {
    const dsrProject = await prisma.project.create({
      data: {
        projectName: `DSR ${dc.district.name} 2026`,
        projectCode: `DSR-${dc.prefix}-2026`,
        districtId: dc.district.id,
        year: "2026",
        status: ProjectStatus.IN_PROGRESS
      }
    });

    const repProject = await prisma.project.create({
      data: {
        projectName: `Replenishment ${dc.district.name} 2026`,
        projectCode: `REP-${dc.prefix}-2026`,
        districtId: dc.district.id,
        year: "2026",
        status: ProjectStatus.IN_PROGRESS
      }
    });

    // Assign users to project members
    const districtUsers = createdUsers.filter(u => u.districtId === dc.district.id);
    for (const u of districtUsers) {
      await prisma.projectMember.create({
        data: { projectId: dsrProject.id, userId: u.id, role: u.role }
      });
      await prisma.projectMember.create({
        data: { projectId: repProject.id, userId: u.id, role: u.role }
      });
    }

    // Seed Notification and AuditLog
    const admin = districtUsers.find(u => u.role === Role.DISTRICT_ADMIN);
    if (admin) {
      await prisma.notification.create({
        data: { userId: admin.id, type: "PROJECT_ASSIGNED", message: `You have been assigned to project ${dsrProject.projectName}` }
      });
      await prisma.auditLog.create({
        data: { userId: admin.id, action: "PROJECT_CREATED", method: "POST", path: "/api/projects", metadata: { projectId: dsrProject.id.toString() } }
      });
    }
  }

  console.log("Seed data created successfully.");
}

async function main() {
  await clearData();
  await seedData();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
