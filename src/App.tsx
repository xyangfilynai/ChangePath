import React, { useCallback, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { DashboardPage } from './components/DashboardPage';
import { QuestionCard } from './components/QuestionCard';
import { ReviewPanel } from './components/ReviewPanel';
import { FeedbackSurvey } from './components/FeedbackSurvey';
import { HandoffPage } from './components/HandoffPage';
import { Icon } from './components/Icon';
import { BlockBanners } from './components/BlockBanners';
import { SAMPLE_CASES } from './sample-cases';
import {
  getBlocks,
  getBlockFields,
  computeDerivedState,
  computeDetermination,
  isAnsweredValue,
  type AssessmentField,
} from './lib/assessment-engine';
import { buildCaseSummary } from './lib/assessment-metadata';
import { useCascadeClearing } from './hooks/useCascadeClearing';
import { useAssessmentProgress, useCompletedBlocks } from './hooks/useAssessmentProgress';
import { useAssessmentWorkspace } from './hooks/useAssessmentWorkspace';

export const App: React.FC = () => {
  const {
    screen,
    setScreen,
    answers,
    setAnswers,
    currentBlockIndex,
    setCurrentBlockIndex,
    currentAssessmentId,
    savedAssessments,
    validationErrors,
    setValidationErrors,
    hasSavedSession,
    currentReviewerNotes,
    handleReset,
    handleLoadAssessment,
    handleDuplicateAssessment,
    handleDeleteAssessment,
    handleAddNote,
    handleRemoveNote,
    handleSaveAssessment,
    handleHome,
    handleOpenSampleCase,
    handleFullAssessment,
    handleResume,
  } = useAssessmentWorkspace();

  // Compute derived state from answers
  const derivedState = useMemo(() => computeDerivedState(answers), [answers]);
  const blocks = useMemo(() => getBlocks(answers, derivedState), [answers, derivedState]);

  const getFieldsForBlock = useCallback(
    (blockId: string): AssessmentField[] => {
      return getBlockFields(blockId, answers, derivedState);
    },
    [answers, derivedState],
  );

  useEffect(() => {
    if (currentBlockIndex > blocks.length - 1) {
      setCurrentBlockIndex(Math.max(0, blocks.length - 1));
    }
  }, [blocks.length, currentBlockIndex, setCurrentBlockIndex]);

  const currentBlock = blocks[currentBlockIndex];
  const currentBlockFields = useMemo(
    () => (currentBlock ? getFieldsForBlock(currentBlock.id) : []),
    [currentBlock, getFieldsForBlock],
  );

  const determination = useMemo(() => computeDetermination(answers), [answers]);

  // --- Extracted hooks ---
  const handleAnswerChange = useCascadeClearing(setAnswers);

  const {
    answeredCounts,
    totalCounts,
    requiredAnsweredCounts,
    requiredCounts,
    overallAnswered,
    overallTotal,
    overallRequiredAnswered,
    overallRequiredTotal,
  } = useAssessmentProgress(blocks, answers, getFieldsForBlock);

  const completedBlocks = useCompletedBlocks(blocks, requiredAnsweredCounts, requiredCounts);

  // --- Block completion & validation ---
  const currentBlockComplete = useMemo(() => {
    if (!currentBlock || currentBlock.id === 'review') return true;
    const requiredPathwayFields = currentBlockFields.filter((q) => !q.sectionDivider && !q.skip && q.pathwayCritical);
    return requiredPathwayFields.every((q) => isAnsweredValue(answers[q.id]));
  }, [currentBlock, currentBlockFields, answers]);

  const currentMissingRequired = useMemo(() => {
    if (!currentBlock || currentBlock.id === 'review') return 0;
    return Math.max(0, (requiredCounts[currentBlock.id] || 0) - (requiredAnsweredCounts[currentBlock.id] || 0));
  }, [currentBlock, requiredCounts, requiredAnsweredCounts]);

  const caseSummary = useMemo(() => buildCaseSummary(answers), [answers]);

  // --- Navigation ---
  const handlePrevious = useCallback(() => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setScreen('dashboard');
    }
  }, [currentBlockIndex, setCurrentBlockIndex, setScreen]);

  const handleNext = useCallback(() => {
    if (currentBlockIndex < blocks.length - 1) {
      if (currentBlock && currentBlock.id !== 'review' && !currentBlockComplete) {
        const errors: Record<string, boolean> = {};
        currentBlockFields
          .filter((q) => !q.sectionDivider && !q.skip && q.pathwayCritical)
          .forEach((q) => {
            if (!isAnsweredValue(answers[q.id])) {
              errors[q.id] = true;
            }
          });
        setValidationErrors(errors);
        return;
      }
      setCurrentBlockIndex(currentBlockIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [
    currentBlockIndex,
    blocks.length,
    currentBlock,
    currentBlockComplete,
    currentBlockFields,
    answers,
    setCurrentBlockIndex,
    setValidationErrors,
  ]);

  const handleBlockSelect = useCallback(
    (index: number) => {
      setCurrentBlockIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setCurrentBlockIndex],
  );

  // --- Screen routing ---
  if (screen === 'dashboard') {
    return (
      <DashboardPage
        onFullAssessment={handleFullAssessment}
        onResume={handleResume}
        hasSavedSession={hasSavedSession}
        sampleCases={SAMPLE_CASES}
        onOpenSampleCase={handleOpenSampleCase}
        savedAssessments={savedAssessments}
        onLoadAssessment={handleLoadAssessment}
        onDuplicateAssessment={handleDuplicateAssessment}
        onDeleteAssessment={handleDeleteAssessment}
      />
    );
  }

  if (screen === 'feedback') {
    return <FeedbackSurvey onBack={() => setScreen('assess')} />;
  }

  if (screen === 'handoff') {
    return (
      <HandoffPage
        determination={determination}
        answers={answers}
        onBack={() => {
          setCurrentBlockIndex(blocks.length - 1);
          setScreen('assess');
        }}
        onBackToAssessment={() => {
          setCurrentBlockIndex(0);
          setScreen('assess');
        }}
      />
    );
  }

  // --- Assessment flow ---
  const renderBlockContent = () => {
    if (!currentBlock) return null;

    if (currentBlock.id === 'review') {
      return (
        <ReviewPanel
          determination={determination}
          answers={answers}
          blocks={blocks}
          getFieldsForBlock={getFieldsForBlock}
          onHandoff={() => setScreen('handoff')}
          reviewerNotes={currentReviewerNotes}
          onAddNote={currentAssessmentId ? handleAddNote : undefined}
          onRemoveNote={currentAssessmentId ? handleRemoveNote : undefined}
          assessmentId={currentAssessmentId}
        />
      );
    }

    return (
      <div>
        <BlockBanners
          blockId={currentBlock.id}
          answers={answers}
          derivedState={derivedState}
          currentBlockComplete={currentBlockComplete}
          currentMissingRequired={currentMissingRequired}
        />

        {currentBlockFields.map((field, index) => (
          <QuestionCard
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={(value) => handleAnswerChange(field.id, value)}
            index={index}
            hasValidationError={Boolean(validationErrors[field.id])}
          />
        ))}
      </div>
    );
  };

  return (
    <Layout
      blocks={blocks}
      currentBlockIndex={currentBlockIndex}
      onBlockSelect={handleBlockSelect}
      completedBlocks={completedBlocks}
      answeredCounts={answeredCounts}
      totalCounts={totalCounts}
      requiredAnsweredCounts={requiredAnsweredCounts}
      requiredCounts={requiredCounts}
      overallAnswered={overallAnswered}
      overallTotal={overallTotal}
      overallRequiredAnswered={overallRequiredAnswered}
      overallRequiredTotal={overallRequiredTotal}
      caseSummary={caseSummary}
      onReset={handleReset}
      onHome={handleHome}
      onSaveAssessment={() => {
        handleSaveAssessment(determination.pathway);
      }}
      canSaveAssessment={Object.keys(answers).length > 0}
      saveLabel={currentAssessmentId ? 'Update library record' : 'Save to library'}
    >
      {renderBlockContent()}

      {/* Navigation buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-xl)',
          paddingTop: 'var(--space-lg)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={handlePrevious}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md) var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Icon name="arrowLeft" size={16} />
          {currentBlockIndex === 0 ? 'Dashboard' : 'Previous'}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            {currentBlockIndex + 1} of {blocks.length}
          </span>

          {currentBlockIndex < blocks.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Continue
              <Icon name="arrow" size={16} color="#fff" />
            </button>
          )}
        </div>
      </div>

      {/* Incomplete warning */}
      {!currentBlockComplete && currentBlock?.id !== 'review' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
          }}
        >
          <Icon name="alertCircle" size={16} color="var(--color-warning)" />
          <span
            style={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}
          >
            Complete all required fields in this section to continue.
          </span>
        </div>
      )}
    </Layout>
  );
};
