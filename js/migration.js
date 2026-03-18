// ===== AUTOMATIC MIGRATION SCRIPT =====
// Run this once to migrate all localStorage data to database

(async function() {
    console.log('Starting automatic migration...');
    
    const results = {
        journals: { success: 0, failed: 0, skipped: 0 },
        opinions: { success: 0, failed: 0, skipped: 0 },
        total: 0
    };

    // 1. Migrate Journals
    try {
        const journalsRaw = localStorage.getItem('journals');
        if (journalsRaw) {
            const journals = JSON.parse(journalsRaw);
            console.log(`Found ${journals.length} journals to migrate`);
            
            for (const journal of journals) {
                if (journal.server_id) {
                    results.journals.skipped++;
                    continue;
                }

                try {
                    const result = await window.createJournal({
                        title: journal.title,
                        abstract: journal.abstract,
                        authors: journal.author,
                        tags: journal.tags,
                        fileUrl: journal.fileData,
                        coverUrl: journal.coverImage,
                        client_temp_id: journal.id,
                        client_updated_at: journal.date
                    });

                    if (result.ok) {
                        journal.server_id = result.id;
                        journal.migrated_at = new Date().toISOString();
                        results.journals.success++;
                        console.log(` Migrated journal: ${journal.title}`);
                    } else {
                        results.journals.failed++;
                        console.error(` Failed journal: ${journal.title}`, result.message);
                    }
                } catch (err) {
                    results.journals.failed++;
                    console.error(` Error migrating journal: ${journal.title}`, err);
                }
            }

            // Update localStorage with server IDs
            localStorage.setItem('journals', JSON.stringify(journals));
        }
    } catch (err) {
        console.error('Journal migration error:', err);
    }

    // 2. Migrate Opinions
    try {
        const opinionsRaw = localStorage.getItem('opinions');
        if (opinionsRaw) {
            const opinions = JSON.parse(opinionsRaw);
            console.log(`Found ${opinions.length} opinions to migrate`);
            
            for (const opinion of opinions) {
                if (opinion.server_id) {
                    results.opinions.skipped++;
                    continue;
                }

                try {
                    const result = await window.createOpinion({
                        title: opinion.title,
                        description: opinion.description,
                        category: opinion.category,
                        author_name: opinion.author || 'Anonymous',
                        fileUrl: opinion.fileUrl,
                        coverUrl: opinion.coverImage
                    });

                    if (result.ok) {
                        opinion.server_id = result.id;
                        opinion.migrated_at = new Date().toISOString();
                        results.opinions.success++;
                        console.log(` Migrated opinion: ${opinion.title}`);
                    } else {
                        results.opinions.failed++;
                        console.error(` Failed opinion: ${opinion.title}`, result.message);
                    }
                } catch (err) {
                    results.opinions.failed++;
                    console.error(` Error migrating opinion: ${opinion.title}`, err);
                }
            }

            // Update localStorage with server IDs
            localStorage.setItem('opinions', JSON.stringify(opinions));
        }
    } catch (err) {
        console.error('Opinion migration error:', err);
    }

    // 3. Print Summary
    results.total = results.journals.success + results.opinions.success;
    console.log('\nMigration Summary:');
    console.log('-----------------------------');
    console.log(`Journals: ${results.journals.success} success, ${results.journals.failed} failed, ${results.journals.skipped} skipped`);
    console.log(`Opinions: ${results.opinions.success} success, ${results.opinions.failed} failed, ${results.opinions.skipped} skipped`);
    console.log(`\nTotal migrated: ${results.total} items`);
    console.log('-----------------------------');

    if (results.total > 0) {
        console.log(' Migration completed successfully!');
        console.log('You can now safely clear localStorage data.');
    } else {
        console.log('No new data to migrate.');
    }

    return results;
})();
