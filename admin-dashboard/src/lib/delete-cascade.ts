import prisma from "@/lib/prisma";

/**
 * Safely cascades the deletion of multiple properties and all of their related records in bulk batches:
 * images, shortlists, client assignments, commissions, transactions, investments, conversations.
 */
export async function deleteMultiplePropertiesWithRelations(propertyIds: string[], tx: any = prisma) {
  if (!propertyIds || propertyIds.length === 0) return;

  // 1. Find all investment IDs across all these properties in 1 batch query
  const investments = await tx.investment.findMany({
    where: { property_id: { in: propertyIds } },
    select: { id: true },
  });
  const investmentIds = investments.map((inv: any) => inv.id);

  // 2. Delete Agent Commissions
  await tx.agentCommission.deleteMany({
    where: {
      OR: [
        { property_id: { in: propertyIds } },
        ...(investmentIds.length > 0 ? [{ investment_id: { in: investmentIds } }] : []),
      ],
    },
  });

  // 3. Delete Transactions
  await tx.transaction.deleteMany({
    where: {
      OR: [
        { property_id: { in: propertyIds } },
        ...(investmentIds.length > 0 ? [{ investment_id: { in: investmentIds } }] : []),
      ],
    },
  });

  // 4. Delete Investments
  if (investmentIds.length > 0) {
    await tx.investment.deleteMany({
      where: { id: { in: investmentIds } },
    });
  }

  // 5. Delete Agent Client Property assignments
  await tx.agentClientProperty.deleteMany({
    where: { property_id: { in: propertyIds } },
  });

  // 6. Delete Shortlists
  await tx.shortlist.deleteMany({
    where: { property_id: { in: propertyIds } },
  });

  // 7. Delete Property Images
  await tx.propertyImage.deleteMany({
    where: { property_id: { in: propertyIds } },
  });

  // 8. Delete Property Inquiry Conversations if any
  try {
    const conversations = await tx.conversation.findMany({
      where: { context_id: { in: propertyIds } },
      select: { id: true },
    });
    if (conversations.length > 0) {
      const convIds = conversations.map((c: any) => c.id);
      await tx.message.deleteMany({ where: { conversation_id: { in: convIds } } });
      await tx.conversationParticipant.deleteMany({ where: { conversation_id: { in: convIds } } });
      await tx.conversation.deleteMany({ where: { id: { in: convIds } } });
    }
  } catch (e) {
    // Optional table
  }

  // 9. Delete all properties in a single batch query
  await tx.property.deleteMany({
    where: { id: { in: propertyIds } },
  });
}

/**
 * Safely cascades the deletion of a single property.
 */
export async function deletePropertyWithRelations(propertyId: string, tx: any = prisma) {
  return deleteMultiplePropertiesWithRelations([propertyId], tx);
}

/**
 * Deletes a Developer firm entity or Builder Profile account along with all their properties.
 */
export async function deleteDeveloperWithProperties(id: string) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Check if it's a Developer firm entity
      const developer = await tx.developer.findUnique({
        where: { id },
        select: { id: true },
      });

      if (developer) {
        // Find all property IDs for this developer
        const props = await tx.property.findMany({
          where: { developer_id: id },
          select: { id: true },
        });
        const propIds = props.map((p: any) => p.id);

        if (propIds.length > 0) {
          await deleteMultiplePropertiesWithRelations(propIds, tx);
        }

        // Delete the developer firm entity
        return tx.developer.delete({ where: { id } });
      }

      // 2. Check if it's a Builder / Developer Profile account
      const profile = await tx.profile.findUnique({
        where: { id },
        select: { id: true },
      });

      if (profile) {
        // Find all properties posted by or linked to this builder profile
        const props = await tx.property.findMany({
          where: {
            OR: [{ posted_by: id }, { developer_id: id }],
          },
          select: { id: true },
        });
        const propIds = props.map((p: any) => p.id);

        if (propIds.length > 0) {
          await deleteMultiplePropertiesWithRelations(propIds, tx);
        }

        // Clean up profile relations in fast batch queries
        await tx.kycDocument.deleteMany({ where: { user_id: id } });
        await tx.shortlist.deleteMany({ where: { user_id: id } });
        await tx.supportTicket.deleteMany({ where: { user_id: id } });

        // Assets & rentals
        const assets = await tx.asset.findMany({ where: { user_id: id }, select: { id: true } });
        const assetIds = assets.map((a: any) => a.id);
        if (assetIds.length > 0) {
          const agreements = await tx.rentalAgreement.findMany({ where: { asset_id: { in: assetIds } }, select: { id: true } });
          const agrIds = agreements.map((a: any) => a.id);
          if (agrIds.length > 0) {
            await tx.rentalStatement.deleteMany({ where: { agreement_id: { in: agrIds } } });
            await tx.rentalAgreement.deleteMany({ where: { id: { in: agrIds } } });
          }
          await tx.assetDocument.deleteMany({ where: { asset_id: { in: assetIds } } });
          await tx.asset.deleteMany({ where: { id: { in: assetIds } } });
        }

        // Agent / Client relations if any
        await tx.chatMessage.deleteMany({ where: { agent_id: id } });
        await tx.agentClient.deleteMany({ where: { agent_id: id } });
        await tx.agentCommission.deleteMany({
          where: { OR: [{ agent_id: id }, { investor_id: id }] },
        });

        // Conversations & Messages
        await tx.message.deleteMany({ where: { sender_id: id } });
        await tx.conversationParticipant.deleteMany({ where: { profile_id: id } });

        // User investments & transactions
        const userInvestments = await tx.investment.findMany({ where: { user_id: id }, select: { id: true } });
        const userInvIds = userInvestments.map((i: any) => i.id);
        if (userInvIds.length > 0) {
          await tx.agentCommission.deleteMany({ where: { investment_id: { in: userInvIds } } });
          await tx.transaction.deleteMany({ where: { investment_id: { in: userInvIds } } });
          await tx.investment.deleteMany({ where: { id: { in: userInvIds } } });
        }
        await tx.transaction.deleteMany({ where: { user_id: id } });

        // Delete the Profile record
        return tx.profile.delete({ where: { id } });
      }

      throw new Error("Developer or Builder account not found");
    },
    {
      maxWait: 20000, // 20s max wait for connection
      timeout: 60000, // 60s interactive transaction timeout
    }
  );
}
